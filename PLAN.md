# Plan del Universo del fútbol

Plan completo y al día (documento vivo): https://claude.ai/artifact/UtJ5YzgBygLrGYDbp4huNZ
Este archivo es el resumen, por si el documento no está a mano. Actualizado el 12 de noviembre de 2026.

## Etapas

0. **Mudanza a GitHub.** Hecha.
1. **Limpiar lo que hay** (Claude, sin datos nuevos): posiciones y nacionalidades (14.200 jugadores sin país, Messi sale como centrocampista), fichajes raros que quedan, prueba automática. Hecha cuando 100 famosos salen bien y tres partidas (1958, 1980, 2000) no dejan figuras en clubes absurdos.
2. **Niveles de 1.500 figuras** 1930-2026: ChatGPT propone por década, Gemini comprueba, Claude importa.
3. **Atributos e insignias**: catálogo + 30 de muestra, luego las 1.500; el resto por fórmula. Pendiente de Anthony: 6 atributos (propuesta) o 10.
4. **Lo que falta de 1958 a 2025**: plantillas reales de clubes de fuera, entrenadores 1964-2025 (hoy 284, todos anteriores), Eurocopa, Copa América, Recopa, UEFA, Libertadores.
5. **Épocas 1930-1957**: plantillas y clasificaciones que faltan.
6. **Estilo y personalidad**, y lo que Anthony elija de tácticas, dinero y cantera.

Las etapas 1 y 3 son de código. Las 2, 4 y 5 son datos y avanzan a la vez en ChatGPT y Gemini.

## Hecho el 12 de noviembre de 2026 (motor)

- Campeones creíbles: los cracks se reparten entre los veinte clubes europeos de más prestigio; quien arrasa en su liga sigue fichando para Europa.
- Diez atributos en el motor y en la ficha (118 figuras a mano en `datos_fuente/base/atributos.csv`, el resto calculado).
- Carreras que dependen de cómo juegan: debut de promesa, crecer por minutos y nota, estado de forma de cada temporada.
- Sorpresas: insignias que se ganan jugando, joyas inesperadas, lesiones graves y regresos, récords reales batidos, rivalidades.
- Balón de Oro con títulos; Copa de Europa más abierta desde 1992.

## En marcha

- Claude: revisión a fondo (partidas largas desde cada época) y arreglar lo flojo.
- ChatGPT con Codex, conectado a este repositorio: mejoras por pull request, acotadas a archivos que Claude no esté tocando. Primera tarea: "El libro de la década" en `js/app.js`.
- ChatGPT (chat): niveles y atributos de 200 figuras de 1970 a 1999, en CSV.
- Falta en los datos: Claude Makélélé y Lev Yashin no están en la base.

## Reglas de trabajo

- Los pedidos a otras IA: uno por mensaje, una tabla, una década o un país. Lo que propone una lo comprueba la otra. Dato no encontrado = vacío, nunca inventado.
- Las entregas llegan como .csv o .zip y se guardan en este repositorio el mismo día.
- Avisar a Anthony antes de un trabajo largo y antes de publicar un cambio que reinicie su partida guardada.
