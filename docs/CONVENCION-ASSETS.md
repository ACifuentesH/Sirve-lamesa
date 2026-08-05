# Convención de assets

**Estado: congelado tras la Fase 0 (issue #2).** La Vía B genera los archivos; la Vía A los referencia en seeds y build. Cambios solo por acuerdo de ambas vías.

## Estructura

```
angular-app/src/assets/
├── characters/          # 8 archivos .webp, exactamente 500×500, < 60 KB
│   ├── santi.webp    sofia.webp    mateo.webp    valeria.webp
│   └── carlos.webp   elena.webp    juan.webp     maria.webp
└── foods/
    ├── desayuno/        # 11 archivos .webp, 256×256, fondo transparente
    ├── almuerzo/        # 12 archivos
    └── cena/            # 11 archivos
```

## Reglas

1. **Nombre de archivo = `slug` del alimento o personaje, exactamente** (Anexos B y C del plan). Sin mayúsculas, sin acentos, sin espacios.
2. **Rutas relativas siempre**: `assets/...`, nunca `/assets/...`. Requisito de la §7.2 para funcionar dentro de un `<iframe>` servido desde un subdirectorio.
3. Personajes: `.webp` 500×500 exactos, menos de 60 KB cada uno (calidad ~82).
4. Alimentos: `.webp` 256×256, fondo transparente.
5. Durante el desarrollo se usan **placeholders con el nombre final ya correcto**: reemplazar el binario después no toca código.
6. Ningún componente hardcodea rutas de imagen: siempre vienen del campo `imagen` del dato (`Personaje.imagen`, `AlimentoCatalogo.imagen`).
