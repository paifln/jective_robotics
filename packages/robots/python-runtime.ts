import {z} from 'zod';

export const PythonTargetSchema=z.enum(['uno','esp32']);
export const PythonRequestSchema=z.object({
 target:PythonTargetSchema,
 action:z.enum(['check','run','deploy','stop-board','probe','install']),
 files:z.record(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]{0,39}\.py$/),z.string().max(500000)),
 port:z.string().regex(/^COM[1-9]\d{0,5}$/i).optional(),
}).strict().refine(request=>Object.keys(request.files).length<=16&&
 Object.values(request.files).reduce((size,source)=>size+source.length,0)<=500000);
export type PythonRequest=z.infer<typeof PythonRequestSchema>;
export const PythonResultSchema=z.object({state:z.enum(['succeeded','failed','interrupted']),log:z.string()});

export const unoPythonStarter=`from jective_robot import forward, stop
from time import sleep

try:
    forward()
    sleep(0.5)
finally:
    stop()
`;

export const espPythonStarter=`from machine import Pin
from time import sleep

led = Pin(2, Pin.OUT)
for _ in range(6):
    led.value(1 - led.value())
    sleep(0.5)
`;

// The existing Uno controller stops the motors if the host heartbeat disappears.
export const unoPythonModule=`import atexit
import os
import threading
import time

_serial = None
_command = b"S"
_lock = threading.Lock()

def _connect():
    global _serial
    if _serial is not None:
        return
    import serial
    _serial = serial.Serial(os.environ["JECTIVE_ROBOT_PORT"], 9600, timeout=0.25, write_timeout=0.25)
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if _serial.readline().strip() == b"ROBOT READY":
            break
    else:
        _serial.close()
        _serial = None
        raise RuntimeError("Install the JECTIVE controller firmware on the Arduino Uno first.")
    threading.Thread(target=_heartbeat, daemon=True).start()

def _heartbeat():
    while True:
        time.sleep(0.08)
        with _lock:
            if _serial is None or _command == b"S":
                continue
            try:
                _serial.write(_command)
            except OSError:
                return

def _send(command):
    global _command
    with _lock:
        _connect()
        _serial.write(command)
        _command = command

def forward():
    _send(b"F")

def backward():
    _send(b"B")

def left():
    _send(b"L")

def right():
    _send(b"R")

def stop():
    if _serial is not None:
        _send(b"S")

def wait_ms(ms):
    time.sleep(ms / 1000)

atexit.register(stop)
`;
