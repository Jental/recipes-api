const express = require('express')
const { MongoClient, ObjectID } = require('mongodb');

const PORT = process.env.PORT || 5000
const MONGO_URI = "mongodb://localhost/eda?retryWrites=true&w=majority";

const setCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
};

const wrapAsync = (fn) => {
  return (req, res, next) => {
    const fnReturn = fn(req, res, next);
    return Promise.resolve(fnReturn).catch(next);
  }
};

const getRecipes = async (req, res) => {
  console.log("getRecipes");
  let limit = req.query.limit || 50;
  let offset = req.query.offset || 0;

  let client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await client.connect();
  let cursor = await client.db().collection('recipes').find({}, { limit : limit, offset: offset});
  let recipes = await cursor.toArray();
  await client.close();

  console.log("getRecipes: result:", recipes.length);

  res.status(200).json(recipes);
};

const getRecipe = async (req, res) => {  
  let id = req.params.id;
  console.log("getRecipe: ", id);

  let client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await client.connect();
  let recipe = await client.db().collection('recipes').findOne({'_id' : new ObjectID(id)} );
  await client.close();

  console.log("getRecipe: result:", recipe);

  res.status(200).json(recipe);
};


express()
  // .use(express.static(path.join(__dirname, 'public')))
  .use((req, res, next) => {
    setCORS(res);
    next();
  })
  // .set('views', path.join(__dirname, 'views'))
  // .set('view engine', 'ejs')
  .get('/recipes', wrapAsync(getRecipes))
  .get('/recipes/:id', wrapAsync(getRecipe))
  // .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
