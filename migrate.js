const { MongoClient, ObjectID } = require('mongodb');

const MONGO_URI = "mongodb://localhost/eda?retryWrites=true&w=majority";

let client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });

client.connect()
  .then(() => {
    client.db().collection('recipes')
      .find()
	    .toArray()
      .then(res => {
        let promises = res.map((recipe) => {
          let updated = false;
          let fieldsToRemove = [];

          // id -> sourceId
          if (recipe.id) {
            recipe.sourceId = recipe.id;
            delete recipe.id;
            fieldsToRemove.push('id');
            updated = true;
          }

          // src -> source
          if (recipe.src && !recipe.source) {
            recipe.source = recipe.src;
            delete recipe.src;
            fieldsToRemove.push('src');
            updated = true;
          }

          // fill eda.ru source
          if (!recipe.source && recipe.image && recipe.image.src && recipe.image.src.includes('eda')) {
            recipe.source = 'eda.ru'
            updated = true;
          }

          // image -> media
          if (recipe.image) {
            recipe.media = [ recipe.image ];
            delete recipe.image;
            fieldsToRemove.push('image');
            updated = true;
          }
          if (recipe.images) {
            recipe.media = recipe.images.map(i => i);
            delete recipe.images;
            fieldsToRemove.push('images');
            updated = true;
          }

          // text instructions -> object instructions
          if (recipe.instructions && recipe.instructions.length > 0 && recipe.instructions.findIndex(el => typeof(el) != 'string') < 0) { // all are strings
            recipe.instructions = recipe.instructions.map((el, i) => ({ id: i, text: el }));
            updated = true;
          }

          if (updated) {
            console.log(recipe._id, recipe.title);
            
            let objectID = new ObjectID(recipe._id);

            let operations = {};
            if (fieldsToRemove.length > 0) {
              
              operations['$unset'] = {};
              for (let f of fieldsToRemove) {
                operations['$unset'][f] = ''
              }
            }
            operations['$set'] = recipe;
            
            return client.db().collection('recipes')
              .updateOne(
                {_id : objectID},
                operations,
                { upsert: true })
              .then(ures => {
                console.log(recipe._id, recipe.title, "updated");
              });
          }
          else {
            return Promise.resolve();
          }
        });

        Promise.all(promises)
          .then(() => {
            console.log('Finished');
            client.close()
              .then(() => {
                process.exit();
              })
              .catch(console.error);
          })
          .catch(console.error);
      })
      .catch(console.error);
  })
  .catch(console.error);
