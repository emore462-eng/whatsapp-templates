// HU1: Modelo de datos — cada plantilla es una instancia de esta clase.
class Template {
  constructor(titulo, mensaje, hashtag) {
    this.id = crypto.randomUUID(); // id único garantizado — lo usan editar/eliminar
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.hashtag = hashtag;
    this.fecha = new Date(); // guarda el momento exacto de creación
  }
}