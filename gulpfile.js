const gulp = require("gulp");
var fs = require('fs');
var GulpSSH = require('gulp-ssh');
const sass = require("gulp-sass")(require('sass'));
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
  exec('git clone https://github.com/juanMontanez/Cv-Sass.git desarrollo/', function (err, stdout, stderr) {
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

//Tarea para generar el sassdoc
function gensassdoc(){
  return src("./node_modules/bootstrap/scss/**/*.scss")
  .pipe(sassdoc({dest:'./documentacion/'}))
}


function gitadd(cb) {
  exec('git add .', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

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
    .exec(['git clone https://github.com/juanMontanez/CoffeeCor.git'])
}

//Desplegamos un contenedor con el contenido del repositorio clonado
function despliegueawsdocker() {
  return gulpSSH
    .exec(['docker run -d -p 80:80 --name coffeecor -v /home/ec2-user/environment/CoffeeCor/:/usr/local/apache2/htdocs/  httpd:2.4'])
}

//Especificamos los nombres de cada tarea
exports.gitclone = gitclone;
exports.generar = generar;
exports.gensassdoc = gensassdoc;
exports.gitadd = gitadd;
exports.gitcommit = gitcommit;
exports.gitpush = gitpush;
exports.conexionawsgit = conexionawsgit;
exports.despliegueawsdocker = despliegueawsdocker;

//Creamos varias listas de tareas en serie
//Si solo poseemos el fichero gulpfile.js ejecutamos esta tarea
exports.toDo = series(gitclone,generar,gensassdoc,gitpush,conexionawsgit,despliegueawsdocker);

//Si ya tenemos el repositorio en local ejecutamos la siguiente tarea
exports.gendespaws = series(generar,gensassdoc);



