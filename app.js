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

// Gets unique values of an array
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

// MATERIAS PRIMAS
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

app.post('/materia-prima/actualizar/:mp', function(req, res){
  var session = driver.session();
  var oldParam = req.params.mp;
  var newParam = req.body.mp_new_param;
  session
    .run('MATCH(newMP:MateriaPrima {type:{oldParam}}) SET newMP.type = {newParam}', {oldParam: oldParam, newParam: newParam})
    .then(function(result){
      session.close();
      res.redirect('/materias-primas')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});


// RECETAS
app.get('/recetas', function(req, res){
  var session = driver.session();
  session
    .run('MATCH(receta:Receta) RETURN receta')
    .then(function(result){
      session.close();
      var recipieArr = [];
      //console.log(result.records[1]._fields)
      result.records.forEach(function(record){
        console.log(record._fields)
        console.log("-------------------------------------------------")
        recipieArr.push(record._fields[0].properties.name);
      });
      recipieArr = recipieArr.filter(onlyUnique);
      res.render('recetas', {
        recipies: recipieArr
      });
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.post('/receta/nueva', function(req, res){
  var name = req.body.r_name;
  var session = driver.session();
  session
    .run('CREATE(r:Receta {name:{nameParam}})', {nameParam: name})
    .then(function(result){
      session.close();
      res.redirect('/recetas')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.post('/ingrediente/nuevo/:r', function(req, res){
  console.log(req.body.materiasPrimas)
  var newMP = req.body.materiasPrimas;
  var recetaParam = req.params.r;
  var session = driver.session();
  session
    .run('MATCH(r:Receta {name:{recetaParam}}), (mp:MateriaPrima{type:{newMP}}) CREATE(r)-[:Lleva]->(mp)', {recetaParam: recetaParam, newMP: newMP})
    .then(function(result){
      session.close();
      res.redirect('/receta/' + recetaParam + '/ingredientes')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.get('/receta/:r/ingredientes', function(req, res){
  var session = driver.session();
  var recetaParam = req.params.r;
  var mpArr = [];
  session
    .run('MATCH(m:MateriaPrima) RETURN m')
    .then(function(result){
      result.records.forEach(function(record){
        mpArr.push(record._fields[0].properties.type);
      });
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
  session
    .run('MATCH(:Receta{name:{recetaParam}})-[:Lleva]-(m:MateriaPrima) RETURN m', {recetaParam: recetaParam})
    .then(function(result){
      session.close();
      var ingredientesArr = [];
      result.records.forEach(function(record){
        ingredientesArr.push(record._fields[0].properties.type);
      });
      res.render('ingredientes', {
        receta: recetaParam,
        ingredientes: ingredientesArr,
        materiasPrimas: mpArr
      });
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.get('/receta/eliminar-receta/:r', function(req, res){
  var session = driver.session();
  var deleteParam = req.params.r;
  session
    .run('MATCH(r:Receta {name:{deleteParam}}) DETACH DELETE r', {deleteParam: deleteParam})
    .then(function(result){
      session.close();
      res.redirect('/recetas')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.get('/receta/eliminar-ingrediente/:r/:i', function(req, res){
  var session = driver.session();
  var recetaParam = req.params.r;
  var ingredienteParam = req.params.i;
  session
    .run('MATCH(r:Receta {name:{recetaParam}})-[l:Lleva]-(mp:MateriaPrima{type:{ingredienteParam}}) DELETE l', {recetaParam: recetaParam, ingredienteParam: ingredienteParam})
    .then(function(result){
      session.close();
      res.redirect('/receta/' + recetaParam + '/ingredientes')
    })
    .catch(function(error){
      session.close();
      console.log(error);
    });
});

app.listen(3000);
console.log('Server started on port 3000');
module.exports = app;
