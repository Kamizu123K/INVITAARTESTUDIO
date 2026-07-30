# Guía: conectar las 12 invitaciones publicadas en Netlify

Este ZIP ya trae los enlaces integrados en el proyecto MVC de Invita Arte Studio.

## Archivos modificados

- `js/data/seedData.js`: las 12 invitaciones publicadas fueron añadidas como versiones finales y vistas publicadas.
- `js/views/PublicView.js`: se agregó la sección **Invitaciones publicadas** en el inicio.
- `js/controllers/CatalogController.js`: la vista rápida ahora muestra el botón **Abrir publicada**.
- `css/styles.css`: estilos para la nueva sección de publicaciones.
- `sql/actualizar_links_netlify_publicados.sql`: script para actualizar Supabase si usas base de datos real.

## Si usas modo demo/local

Solo abre `index.html` o publica este proyecto en Netlify. El proyecto cargará los datos nuevos automáticamente.

## Si usas Supabase real

1. Entra a Supabase.
2. Abre **SQL Editor**.
3. Copia y ejecuta el contenido de `sql/actualizar_links_netlify_publicados.sql`.
4. Vuelve a cargar la página del proyecto.

## Enlaces integrados

1. 01 Mis 15 años: https://6a358fa967d5ad0a202eeed6--superlative-dasik-4f324a.netlify.app/
2. 02 Acto de graduación: https://jazzy-paletas-40528a.netlify.app/
3. 03 Nuestra boda: https://dulcet-toffee-8ce1a3.netlify.app/
4. 04 Workshop de Innovación: https://verdant-puppy-8fdb9f.netlify.app/
5. 05 Baby Shower de Sofía: https://eclectic-creponne-f9e5ed.netlify.app/
6. 06 Cumple 30: https://animated-pegasus-d3ebba.netlify.app/
7. 07 Bautizo de Mateo: https://regal-seahorse-6b0c81.netlify.app/
8. 08 Aniversario 25 años: https://tangerine-melba-9d6207.netlify.app/
9. 09 Primera Comunión: https://quiet-sunflower-b4ec57.netlify.app/
10. 10 Inauguración Boutique: https://nimble-concha-486067.netlify.app/
11. 11 Cena de despedida: https://inquisitive-malasada-5e626b.netlify.app/
12. 12 Reunión familiar: https://cozy-arithmetic-838edb.netlify.app/
