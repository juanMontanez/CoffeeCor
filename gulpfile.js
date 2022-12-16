const gulp = require("gulp");
var fs = require('fs');
var GulpSSH = require('gulp-ssh');


var config = {
  host: 'coffeecor.duckdns.org',
  port: 22,
  username: 'ec2-user',
  privateKey: fs.readFileSync('C:/Users/Juan/Downloads/MiClaveAws.pem')
}
 
var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config
})

gulp.task('exec', function () {
  return gulpSSH
    .exec(['docker stop webcv'])
})
