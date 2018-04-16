var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;


var app = express();

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Connection to DB
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '40846382'));

// Renders materiasPrimas.ejs and passes a list of all materias primas
app.get('/materias-primas', function(req, res){
  var session = driver.session();
  session
    .run('MATCH(mp:MateriaPrima) RETURN mp')
    .then(function(result){
      session.close();
      var mpArr = [];
      result.records.forEach(function(record){
        mpArr.push({
          type: record._fields[0].properties.type
        });
      });
      res.render('materiasPrimas', {
        materiasPrimas: mpArr
      });
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.post('/materia-prima/nueva', function(req, res){
  var type = req.body.mp_type;
  var session = driver.session();
  session
    .run('CREATE(mp:MateriaPrima {type:{typeParam}})', {typeParam: type})
    .then(function(result){
      session.close();
      res.redirect('/materias-primas')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.get('/materia-prima/eliminar/:mp', function(req, res){
  var session = driver.session();
  var deleteParam = req.params.mp;
  session
    .run('MATCH(mp:MateriaPrima {type:{deleteParam}}) DELETE mp', {deleteParam: deleteParam})
    .then(function(result){
      session.close();
      res.redirect('/materias-primas')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});


// Renders recetas.ejs and passes a list of all recetas
app.get('/recetas', function(req, res){
  var session = driver.session();
  session
    .run('MATCH(cerealConLeche:Receta) RETURN cerealConLeche')
    .then(function(result){
      session.close();
      var recipieArr = [];
      result.records.forEach(function(record){
        console.log(record._fields[1])
        recipieArr.push({
          name: record._fields[0].properties.name
        });
      });
      res.render('recetas', {
        recipies: recipieArr
      });
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.listen(3000);
console.log('Server started on port 3000');
module.exports = app;
