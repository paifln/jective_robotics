# Jexi

`jexi.png` — оригинальный растровый персонаж помощника JECTIVE, созданный 16 октября 2026 встроенным инструментом image_gen (навык imagegen). PNG с прозрачностью, 1.1 MB; загружается локально, без внешнего сервиса. При сборке копируется в `dist/renderer/jexi.png`.

В интерфейсе используется мягкая CSS-анимация наклона и движения вверх-вниз. Это анимированная иллюстрация, а не интерактивная трёхмерная модель. `JexiMascot.tsx` приостанавливает анимацию вне видимой области, при скрытом окне и вкладке. CSS учитывает системное уменьшение движения и настройку спокойного чтения.

Исходный промпт:

> Create a single original adorable 3D animated-film robot mascot called Jexi for a robotics learning desktop application. Full body centered, front-facing slight three-quarter view, one short rounded arm raised in a friendly wave. Pearl white ceramic shell, rich electric blue accents, dark glossy rounded face screen with two expressive cyan oval eyes, small blue antenna nub, little feet, rounded tactile construction, realistic soft studio lighting and material reflections, polished high-end animation character render, friendly to teenagers without looking like a baby toy. Genuinely transparent background, no floor, no backdrop, no text, no letters, no logo, no extra objects. Generous transparent padding around the whole character. Crisp readable silhouette suitable for a small messenger avatar as well as a 180px welcome illustration. Not flat vector, not line art, not a UI mockup.
