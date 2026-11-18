import {z} from 'zod';
import {WorldSchema} from '../simulator/world-schema';
import {PythonRequestSchema} from './python-runtime';

export const PythonSimulationRequestSchema=z.object({
 id:z.uuid(),world:WorldSchema,files:PythonRequestSchema.shape.files,
}).strict().refine(value=>PythonRequestSchema.safeParse({target:'uno',action:'run',files:value.files}).success);
export type PythonSimulationRequest=z.infer<typeof PythonSimulationRequestSchema>;

const percent=z.number().min(-100).max(100);
export const PythonRobotCommandSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('drive'),left:percent,right:percent}).strict(),
 z.object({kind:z.literal('stop')}).strict(),
 z.object({kind:z.literal('led'),on:z.boolean()}).strict(),
 z.object({kind:z.literal('wait'),ms:z.number().min(0).max(60000)}).strict(),
 z.object({kind:z.literal('sensor'),sensor:z.enum(['distance','lineLeft','lineRight','button','heading','x','y','timeMs','analogCounts','analogVolts'])}).strict(),
]);

export const pythonSimulationStarter=`from jective_robot import forward, right, stop, wait_ms

for _ in range(4):
    forward()
    wait_ms(650)
    right()
    wait_ms(520)
stop()
`;

export const pythonSimulationModule=`import io
import json
import sys
import threading
import time

_out = sys.stdout
_in = sys.stdin
_lock = threading.Lock()
sys.stdout = sys.stderr
sys.stdin = io.StringIO()

def _command(kind, **fields):
    with _lock:
        print(json.dumps(dict(kind=kind, **fields)), file=_out, flush=True)
        result = json.loads(_in.readline())
        if "error" in result:
            raise RuntimeError(result["error"])
        return result["value"]

def drive(left, right):
    _command("drive", left=left, right=right)

def forward(speed=45):
    drive(speed, speed)

def backward(speed=45):
    drive(-speed, -speed)

def left(speed=30):
    drive(-speed, speed)

def right(speed=30):
    drive(speed, -speed)

def stop():
    _command("stop")

def led(on):
    _command("led", on=bool(on))

def wait_ms(ms):
    _command("wait", ms=ms)

def distance():
    return _command("sensor", sensor="distance")

def line_left():
    return _command("sensor", sensor="lineLeft")

def line_right():
    return _command("sensor", sensor="lineRight")

def button():
    return bool(_command("sensor", sensor="button"))

def time_ms():
    return _command("sensor", sensor="timeMs")

time.sleep = lambda seconds: wait_ms(seconds * 1000)
time.sleep_ms = wait_ms
`;

export const pythonSimulationMachine=`from jective_robot import button, led

class Pin:
    IN = 0
    OUT = 1
    PULL_UP = 2

    def __init__(self, number, mode=IN, pull=None):
        self._mode = mode
        self._value = 0

    def value(self, value=None):
        if value is None:
            return int(button()) if self._mode == self.IN else self._value
        self._value = int(bool(value))
        led(self._value)

    def on(self):
        self.value(1)

    def off(self):
        self.value(0)
`;
