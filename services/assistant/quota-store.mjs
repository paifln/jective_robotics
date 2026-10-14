import {DatabaseSync} from 'node:sqlite';
import {chmodSync,openSync,closeSync,lstatSync} from 'node:fs';

/** Atomic request reservations survive restart and are shared by gateway processes. */
export class QuotaStore{
  constructor(path){
    if(typeof path!=='string'||!path||path===':memory:')throw new Error('Set a durable quota file');
    try{closeSync(openSync(path,'wx',0o600));}catch(error){if(error.code!=='EEXIST')throw error;}
    const file=lstatSync(path);
    if(!file.isFile()||file.isSymbolicLink()||(process.platform!=='win32'&&(file.mode&0o077)))throw new Error('Quota file must be private and regular');
    this.database=new DatabaseSync(path);
    try{
    chmodSync(path,0o600);
    this.database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=2000; CREATE TABLE IF NOT EXISTS quota(day TEXT NOT NULL, subject TEXT NOT NULL, requests INTEGER NOT NULL CHECK(requests>=0), PRIMARY KEY(day,subject));');
    this.read=this.database.prepare('SELECT requests FROM quota WHERE day=? AND subject=?');
    this.increment=this.database.prepare('INSERT INTO quota(day,subject,requests) VALUES(?,?,1) ON CONFLICT(day,subject) DO UPDATE SET requests=requests+1');
    this.prune=this.database.prepare('DELETE FROM quota WHERE day<?');
    }catch(error){this.database.close();throw error;}
  }
  reserve(id,dailyLimit,globalDailyLimit,now){
    const day=new Date(now).toISOString().slice(0,10);
    this.database.exec('BEGIN IMMEDIATE');
    try{
      const personal=Number(this.read.get(day,id)?.requests??0),total=Number(this.read.get(day,'@global')?.requests??0);
      if(personal>=dailyLimit||total>=globalDailyLimit){this.database.exec('ROLLBACK');return false;}
      this.increment.run(day,id);this.increment.run(day,'@global');
      this.prune.run(new Date(now-14*86400000).toISOString().slice(0,10));
      this.database.exec('COMMIT');return true;
    }catch(error){this.database.exec('ROLLBACK');throw error;}
  }
  close(){this.database.close();}
}
