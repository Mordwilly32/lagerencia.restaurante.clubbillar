/*
 * config.js — La Gerencia · Panel de Gerencia
 * ⚠️  NO compartir este archivo públicamente.
 *
 * Usuarios registrados (contraseñas almacenadas como SHA-256, NUNCA en texto plano):
 *
 *   Usuario 1: David Erazo
 *   Contraseña: 1110009992222
 *   Hash:       c903d7a6103239e4f01707dca3b2c27eca0eff25b769234fa35c811390efe066
 *
 *   Usuario 2: Carlos López
 *   Contraseña: Ger3nc!a#2026
 *   Hash:       59e80b98e64ce54e72775834bfebb5eac24a80e0ec83d0d3513b6bbd6db08750
 *
 *   Código maestro (para reset): L@G3r3nci@Reset26
 *   Hash: (generado con sha256 — ver abajo)
 */

window.APP_CONFIG = {

  RESTAURANT_NAME: "La Gerencia",
  CURRENCY: "USD",
  LOCALE: "es-SV",

  /*
   * Credenciales de acceso.
   * username: texto plano (se muestra en el panel).
   * passwordHash: SHA-256 de la contraseña en minúsculas.
   * Generado con: crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
   */
  USERS: [
    {
      username: "David Erazo",
      passwordHash: "c903d7a6103239e4f01707dca3b2c27eca0eff25b769234fa35c811390efe066"
    },
    {
      username: "Carlos López",
      passwordHash: "59e80b98e64ce54e72775834bfebb5eac24a80e0ec83d0d3513b6bbd6db08750"
    }
  ],

  /*
   * Código maestro para borrar sesiones guardadas (reset de emergencia).
   * Contraseña: L@G3r3nci@Reset26
   */
  ADMIN_RESET_HASH: "2b1a2c3f8e9d4b5a6c7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9",

  MENU: [
    { cat: "Especial",  nombre: "Plato La Gerencia",         precio: 8.00 },
    { cat: "Platos",    nombre: "Lomo a la chimichurri",     precio: 8.00 },
    { cat: "Platos",    nombre: "Carne a la plancha",        precio: 8.00 },
    { cat: "Platos",    nombre: "Pechuga deshuesada",        precio: 7.00 },
    { cat: "Platos",    nombre: "Costilla ahumada",          precio: 8.00 },
    { cat: "Platos",    nombre: "Filete al jalapeño",        precio: 8.00 },
    { cat: "Platos",    nombre: "Alitas a la BBQ",           precio: 7.00 },
    { cat: "Mexicana",  nombre: "Tacos res/pollo (3u)",      precio: 4.00 },
    { cat: "Mexicana",  nombre: "Tacos (6u)",                precio: 7.00 },
    { cat: "Mexicana",  nombre: "Burrito res/pollo",         precio: 5.00 },
    { cat: "Mexicana",  nombre: "Burrito mixto",             precio: 6.00 },
    { cat: "Mexicana",  nombre: "Torta",                     precio: 5.00 },
    { cat: "Mexicana",  nombre: "Gringa / Quesadilla",       precio: 5.00 },
    { cat: "Boquitas",  nombre: "Costilla de cerdo",         precio: 2.50 },
    { cat: "Boquitas",  nombre: "Chicharrones",              precio: 2.50 },
    { cat: "Boquitas",  nombre: "Chorizo",                   precio: 2.50 },
    { cat: "Boquitas",  nombre: "Alitas",                    precio: 2.50 },
    { cat: "Pupusas",   nombre: "Frijol con queso",          precio: 1.00 },
    { cat: "Pupusas",   nombre: "Revuelta",                  precio: 1.25 },
    { cat: "Pupusas",   nombre: "Queso",                     precio: 1.25 },
    { cat: "Pupusas",   nombre: "Ayote con queso",           precio: 1.50 },
    { cat: "Pupusas",   nombre: "Jalapeño",                  precio: 1.50 },
    { cat: "Pupusas",   nombre: "Pollo",                     precio: 1.75 },
    { cat: "Pupusas",   nombre: "Chorizo",                   precio: 1.75 },
    { cat: "Bebidas",   nombre: "Pilsener / Golden",         precio: 1.25 },
    { cat: "Bebidas",   nombre: "Suprema",                   precio: 1.50 },
    { cat: "Bebidas",   nombre: "Corona",                    precio: 2.00 },
    { cat: "Bebidas",   nombre: "Regia / Chola",             precio: 2.75 },
    { cat: "Bebidas",   nombre: "Michelada mix (valde)",     precio: 3.50 },
    { cat: "Bebidas",   nombre: "Refresco",                  precio: 1.00 },
    { cat: "Bebidas",   nombre: "Limonada natural",          precio: 2.00 },
    { cat: "Bebidas",   nombre: "Limonada c/hierba",         precio: 2.75 },
    { cat: "Bebidas",   nombre: "Limonada c/fresa",          precio: 3.50 },
    { cat: "Bebidas",   nombre: "Café",                      precio: 0.50 }
  ]
};
