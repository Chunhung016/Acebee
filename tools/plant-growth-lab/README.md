# Plant Growth Lab

An offline, bilingual (English / 华语) 3D plant life-cycle lab for the classroom, built with Three.js r158.
Students follow a bean and a tomato through eight stages, from seed to fruit.

**Live app:** `public/plant-growth-lab/index.html`, served at `/plant-growth-lab/`. It is a single self-contained file that also works when opened directly from disk.

## Features
- Continuous germination: the seed, root, hypocotyl and cotyledons grow as one connected structure.
- Watering sequence: rain, wetting front in the soil, root uptake, xylem transport and transpiration.
- Photosynthesis sequence: light, CO₂ gas, water, sugar in the phloem and O₂ release, with an equation chip.
- Microscope: live 3D cross-sections of a leaf, a stem and the root-hair zone.
- "What if?" experiments: no water (wilting, leaf fall), no light (dark box, etiolation), light from one side (phototropism), tipped pot (gravitropism), water on one side (hydrotropism), support stick (thigmotropism) and growing a new plant from a cutting.
- Before/after comparison ghost, growth ruler, lighting moods and snapshots.

## Editing
The app is assembled from the files in `parts/`. After editing them, rebuild with:

```bash
./tools/plant-growth-lab/build.sh
```

| File | Contents |
| --- | --- |
| `head.html` | Page markup, styles and icons |
| `three.html` | Embedded Three.js r158 |
| `a_data*.js` | Stage text, anatomy notes and the English/华语 dictionary |
| `b_engine.js` | Renderer, lighting moods, procedural textures and material helpers |
| `c_soil.js`, `c_plants.js` | Soil cutaway and the shared plant-building toolkit |
| `d_bean.js`, `e_tomato.js` | The two plant models |
| `f_ui.js` | Camera, controls, labels, watering and photosynthesis |
| `g_micro.js` | Microscope views |
| `h_whatif.js`, `i_more.js` | "What if?" experiments, physics and the cutting activity |
| `z_end.js` | Start-up |
