/** Embedded in the desktop bundle; compiled in memory by Windows PowerShell. */
export const windowsBluetoothBridgeSource=String.raw`
using System;
using System.Collections.Concurrent;
using System.IO;
using System.IO.Ports;
using System.Text;
using System.Threading;

public static class JectiveBluetoothBridge {
  static readonly object OutputLock = new object();
  static readonly object ShutdownLock = new object();
  static readonly BlockingCollection<string> Commands = new BlockingCollection<string>(32);
  static volatile bool InputEnded;
  static volatile bool Closing;
  static volatile string InputError;
  static int CloseId;
  static Timer ExitWatchdog;

  static void Emit(string text) {
    lock (OutputLock) { Console.Out.WriteLine(text); Console.Out.Flush(); }
  }
  static void Error(int id, string message) {
    if (message.Length > 256) message = message.Substring(0, 256);
    Emit("error " + id + " " + Convert.ToBase64String(Encoding.UTF8.GetBytes(message)));
  }
  static void WatchExit() {
    lock (ShutdownLock) {
      if (ExitWatchdog == null) ExitWatchdog = new Timer(delegate { Environment.Exit(1); }, null, 1500, Timeout.Infinite);
    }
  }
  static string ReadCommand() {
    StringBuilder line = new StringBuilder();
    while (true) {
      int value = Console.In.Read();
      if (value < 0) return null;
      if (value == 10) return line.ToString();
      if (value == 13) continue;
      if (value < 32 || value > 126 || line.Length >= 5600) throw new IOException("BLUETOOTH_PROTOCOL_ERROR");
      line.Append((char)value);
    }
  }
  static bool RequestId(string text, out int id) {
    return Int32.TryParse(text, out id) && id > 0;
  }
  static void ReadCommands() {
    try {
      while (!Closing) {
        string line = ReadCommand();
        if (line == null) { InputEnded = true; WatchExit(); return; }
        string[] fields = line.Split(' '); int id;
        // Closing takes priority over queued writes. EOF also discards the queue.
        if (fields.Length == 2 && fields[0] == "c" && RequestId(fields[1], out id)) {
          CloseId = id; Closing = true; WatchExit(); return;
        }
        if (!Commands.TryAdd(line)) throw new IOException("BLUETOOTH_PROTOCOL_ERROR");
      }
    } catch (Exception) { InputError = "BLUETOOTH_PROTOCOL_ERROR"; WatchExit(); }
  }
  static bool Command(SerialPort port, string line) {
    string[] fields = line.Split(' '); int id;
    if (fields.Length < 2 || !RequestId(fields[1], out id)) throw new IOException("BLUETOOTH_PROTOCOL_ERROR");
    try {
      if (fields[0] == "w" && fields.Length == 3) {
        byte[] bytes = Convert.FromBase64String(fields[2]);
        if (bytes.Length > 4096) throw new IOException("BLUETOOTH_PROTOCOL_ERROR");
        if (bytes.Length != 0) port.Write(bytes, 0, bytes.Length);
      } else if (fields[0] == "d" && fields.Length == 2) {
        int started = Environment.TickCount;
        while (port.BytesToWrite != 0) {
          if (unchecked(Environment.TickCount - started) >= 200) throw new TimeoutException();
          if (Closing || InputEnded) return false;
          Thread.Sleep(2);
        }
      } else throw new IOException("BLUETOOTH_PROTOCOL_ERROR");
      Emit("ack " + id); return true;
    } catch (TimeoutException) { Error(id, "SERIAL_WRITE_TIMEOUT"); return false; }
      catch (Exception exception) { Error(id, "BLUETOOTH_IO_FAILED: " + exception.Message); return false; }
  }
  public static void Run(string path, int baud) {
    Console.OutputEncoding = new UTF8Encoding(false);
    Thread input = new Thread(ReadCommands); input.IsBackground = true; input.Start();
    SerialPort port = null;
    try {
      port = new SerialPort(path, baud, Parity.None, 8, StopBits.One);
      port.Handshake = Handshake.None;
      port.DtrEnable = true; port.RtsEnable = true;
      port.ReadTimeout = 50; port.WriteTimeout = 250;
      port.Open();
      if (InputEnded || Closing || InputError != null) return;
      Emit("ready");
      byte[] buffer = new byte[1024];
      while (!Closing && !InputEnded && InputError == null) {
        string line;
        if (Commands.TryTake(out line, 10)) {
          if (Closing || InputEnded || InputError != null) break;
          if (!Command(port, line)) break;
        }
        if (Closing || InputEnded || InputError != null) break;
        int available = port.BytesToRead;
        if (available > 0) {
          try {
            int count = port.Read(buffer, 0, Math.Min(buffer.Length, available));
            if (count > 0) Emit("data " + Convert.ToBase64String(buffer, 0, count));
          } catch (TimeoutException) { }
        }
      }
      if (InputError != null) Error(0, InputError);
    } catch (Exception exception) { Error(0, "BLUETOOTH_IO_FAILED: " + exception.Message); }
    finally {
      Closing = true; WatchExit();
      if (port != null) {
        // Also reached when the parent disappears and stdin reaches EOF.
        try { if (port.IsOpen) port.Write("S"); } catch (Exception) { }
        try { port.Close(); } catch (Exception) { }
        try { port.Dispose(); } catch (Exception) { }
      }
      try { Emit("closed " + CloseId); } catch (Exception) { }
    }
  }
}
`;

export function windowsBluetoothBridgeCommand(path:string,baudRate:number){
 if(!/^COM[1-9][0-9]{0,4}$/i.test(path))throw new Error('PORT_INVALID');
 if(![9600,19200,38400,57600,115200,230400].includes(baudRate))throw new Error('BAUD_UNSUPPORTED');
 const script=`$ErrorActionPreference='Stop'\n$ProgressPreference='SilentlyContinue'\nAdd-Type -Language CSharp -TypeDefinition @'\n${windowsBluetoothBridgeSource}\n'@\n[JectiveBluetoothBridge]::Run('${path.toUpperCase()}',${baudRate})`;
 return Buffer.from(script,'utf16le').toString('base64');
}
