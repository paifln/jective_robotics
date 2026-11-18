# Approved toolchain setup

Pinned CLI: 1.5.1. Windows x64 official ZIP SHA256: `fabe42e0eb04d00e776a66178299ff95a46c623dbc260f997e58fd514853dd40`. The downloaded ZIP was compared to the official release checksum. Extract `arduino-cli.exe` into `.toolchain/bin` before building an installer. Never obtain an executable from an imported project or profile.

The Windows installer includes Arduino AVR Boards 1.8.8 and its compiler and upload tools for Uno and Nano. On first launch, Studio copies those files into its per-user toolchain. Before building the installer, run `npm run arduino:setup` on a Windows workstation that already has Arduino AVR Boards 1.8.8 installed. The packaging check verifies the staged SDK.

Run `powershell -ExecutionPolicy Bypass -File scripts/toolchain-setup.ps1` from the repository to install the approved ESP32 3.3.12 packages into the application's per-user toolchain directory. Installation is an explicit online administrator/preparation action; editing never installs anything. Use `-Destination .toolchain/workspace` for isolated compiler tests. Package preparation may download several GB of tools for the ESP32 core. Preserve the official package licenses.

For an offline preparation workflow copy the approved `data`, `downloads` and `user` directories to a removable drive after successful installation, compute SHA256 for every file, and preserve the manifest and package indexes. Copy the bundle into the destination school's `%APPDATA%/jective-robotics-studio/toolchain` before use. The application writes absolute configuration paths for its own destination. This manual bundle procedure still needs an automated integrity-checking importer and a clean disconnected-machine acceptance test; offline compile readiness is not yet certified.

`JECTIVE_TOOLCHAIN_ROOT` overrides only the application-owned toolchain directory for reproducible local test runs. It does not change the executable, FQBN, core recipe or allowed arguments. Do not point it at an unrelated Arduino workspace.

The CLI 1.5.1 help was inspected: `compile --fqbn --build-path` is supported; `upload --fqbn --port --input-dir` uploads without compiling. Upload is not implemented in this milestone.

Official references: [configuration](https://docs.arduino.cc/arduino-cli/configuration/), [ESP32 installation](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html), [CLI release](https://github.com/arduino/arduino-cli/releases/tag/v1.5.1).

## Python 3 и MicroPython

В **Студии** выберите **Код → Python**. Студия сохраняет `main.py`, дополнительные модули `.py`, блоки и черновик C++ в том же проекте. **Запустить Python в симуляторе** открывает рядом с редактором то же поле, которое используется для блоков. Установка отдельного Python для версии Windows не требуется.

Модуль симулятора `jective_robot` управляет виртуальными моторами (`drive(left, right)`, `forward()`, `right()`, `stop()`), считывает виртуальные датчики (`distance()`, `line_left()`, `line_right()`, `button()`) и продвигает модель через `wait_ms(ms)`. В симуляторе базовые вызовы `machine.Pin` моделируют индикатор и кнопку. При загрузке на ESP32 используются реальные модули MicroPython и выводы выбранной платы.

Для запуска из исходников подготовьте комплект командой `npm run python:bundle` на Windows x64 с Python 3.14 и pip. При сборке установщика команда выполняется автоматически. Комплект включает лицензии сторонних компонентов и исходный архив esptool.

- **Arduino Uno.** Выберите USB-порт и нажмите **Установить прошивку Uno**. Студия прошивает контроллер JECTIVE. Затем нажмите **Запустить на Uno**. Программа работает в CPython на компьютере, а модуль `jective_robot` отправляет через USB команды `forward()`, `backward()`, `left()`, `right()` и `stop()` стандартному комплекту робота. Контроллер останавливает моторы при потере команд. Python-программу можно также запустить без платы и пользоваться консолью, включая `print()` и `input()`.
- **ESP32.** Установщик Windows включает CPython, mpremote, esptool и образ ESP32_GENERIC. Для классической ESP32 с памятью от 4 МБ выберите USB-порт, откройте **Настройку платы** и нажмите **Установить MicroPython**. Перед записью студия проверяет тип чипа и размер памяти. Операция стирает файлы и прошивку на выбранной плате. **Проверить MicroPython** подключается к REPL и выводит версию. Для ESP32-S3, C3 и других вариантов установите [образ для своей модели](https://micropython.org/download/) отдельно. После этого выберите USB-порт. **Запустить на ESP32** запускает текущий `main.py` на плате, показывает вывод в студии и обновляет одноимённые вспомогательные модули. **Сохранить на ESP32** сохраняет все файлы на плате. После перезапуска MicroPython исполняет `main.py` автономно. Для GPIO, PWM и других периферийных устройств используйте модуль `machine`. Шаблон использует GPIO 2 для внешнего светодиода на типовой ESP32. Выберите вывод по схеме своей платы.
