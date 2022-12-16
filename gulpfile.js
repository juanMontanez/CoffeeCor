const gulp = require("gulp");
var fs = require('fs');
const gulpCopy = require("gulp-copy");
var GulpSSH = require('gulp-ssh');
const sass = require("gulp-dart-scss");
const sassdoc = require("sassdoc");
const { series, src, dest } = require("gulp");
var exec = require('child_process').exec

//Configuración ssh para la conexión con AWS utilizando un certificado
var config = {
  host: 'coffeecor.duckdns.org',
  port: 22,
  username: 'ec2-user',
  privateKey: fs.readFileSync('C:/Users/Juan/Downloads/MiClaveAws.pem')
}

//Asignamos la configuración a la variable gulpSSH que se utilizará en la tareas de conexión con aws
var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config
})


//Tarea para clonar el contenido del repositorio git
function gitclone(cb) {
  exec('git clone https://github.com/juanMontanez/CoffeeCor.git desarrollo/', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

//Tarea para compilar el scss de bootstrap a css
function generar() {
  return src("./node_modules/bootstrap/scss/bootstrap.scss")
    .pipe(sass())
    .pipe(dest("./produccion"))
}

//Definimos las variables que contendran la ruta y la extensión de los ficheros a copiar y el destino donde van a ser copiados
var sourceFiles = [
  "./img/*",
  "./*.html",
];
var destination = "./produccion";

//Tarea para copiar todo el contenido de la carpeta img y los html
function copiar() {
  return (
    gulp
      .src(sourceFiles)
      //Copiamos a destino con parametro prefix:0 para que copie la carpeta origen y su contenido
      .pipe(gulpCopy(destination, { prefix: 0 }))
  );
}

//Tarea para generar el sassdoc
function gensassdoc(){
  return src("./node_modules/bootstrap/scss/**/*.scss")
  .pipe(sassdoc({dest:'./documentacion/'}))
}

//Tarea para realizar un git add
function gitadd(cb) {
  exec('git add .', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

//Tarea para realizar un commit en git
function gitcommit(cb) {
  exec('git commit -m "Subida desde gulp"', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

//Tarea para subir el contenido al repositorio de git
function gitpush(cb) {
  exec('git push -u origin main ', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

//Accedemos mediantes ssh a AWS y nos clonamos el repositorio de git
function conexionawsgit() {
  return gulpSSH
  .shell(['cd /home/ec2-user/environment/Contenedores', 'rm -r CoffeeCor', 'git clone https://github.com/juanMontanez/CoffeeCor.git'], {filePath: 'shell.log'})
    .pipe(gulp.dest('logs'))
}

//Desplegamos un contenedor con el contenido del repositorio clonado
function despliegueawsdocker() {
  return gulpSSH
    .exec(['docker run -d -p 80:80 --name coffeecor -v /home/ec2-user/environment/Contenedores/CoffeeCor/:/usr/local/apache2/htdocs/  httpd:2.4'])
}

//Especificamos los nombres de cada tarea
exports.gitclone = gitclone;
exports.copiar = copiar;
exports.generar = generar;
exports.gensassdoc = gensassdoc;
exports.gitadd = gitadd;
exports.gitcommit = gitcommit;
exports.gitpush = gitpush;
exports.conexionawsgit = conexionawsgit;
exports.despliegueawsdocker = despliegueawsdocker;

//Creamos dos listas de tareas en serie
//Si solo poseemos el fichero gulpfile.js ejecutamos esta tarea
exports.toDo = series(gitclone,copiar,generar,gensassdoc,gitadd,gitcommit,gitpush,conexionawsgit,despliegueawsdocker);

//Si ya tenemos el repositorio en local ejecutamos la siguiente tarea
exports.gendespaws = series(copiar,generar,gensassdoc,gitadd,gitcommit,gitpush,conexionawsgit,despliegueawsdocker);