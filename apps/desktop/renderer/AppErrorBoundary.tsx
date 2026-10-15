import React from 'react';
import {RecoveryScreen} from './RecoveryScreen';
import {finishLaunchScreen} from './launch-screen';
export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){finishLaunchScreen();}
 render(){
  const language=document.documentElement.lang;
  return this.state.failed?<RecoveryScreen kind="interface" locale={language==='en'||language==='kk'?language:'ru'}/>:this.props.children;
 }
}
