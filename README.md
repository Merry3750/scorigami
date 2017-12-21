# Scorigami

Scorigami is a concept thought up by Jon Bois. It is the art of building final scores that have never happened before in NFL history. Due to the unique nature of how points are scored in (American) Football, where it is impossible to score 1 point on its own, as well as the rarity of the 2 point safety and 8 point touchdown and 2 point conversion, there are a lot of scores that are possible, but have never happened.

This project is dedicated to tracking all scorigami throughout history and keeping the scorigami chart up to date at all times.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You will need [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/).

You will also need a PostgreSQL server in order to run and develop for the server. For information on how to set up a server, see [this tutorial](https://www.techrepublic.com/blog/diy-it-guy/diy-a-postgresql-database-server-setup-anyone-can-handle/). After setting up the server, be sure to create a database on that server (the tutorial has instructions for that as well).

### Installing

A step by step series of examples that tell you have to get a development env running

Clone the repository and install dependencies

```
git clone git@github.com:ACMerriman/scorigami.git # or clone your own fork
cd scorigami
npm install
```

go to /js/dbVars.js and change DATABASE_URL to your database URL. You may also change ADD_DEBUG_TABLES, but it is recommended you keep it true unless you have limited space. 

```
var DATABASE_URL = "postgres://{{USERNAME}}:{{PASSWORD}}@{{SERVER HOST}}:{{PORT}}/{{DATABASE NAME}}"; //
var ADD_DEBUG_TABLES = true; //creates a second set of tables, identical to the first set that can be used for testing
```

Populate your database, luckily, I have written a script to do this for you

```
npm run setup
```

Run the app.

```
npm start
```

Your app should now be running on [localhost:8081](http://localhost:8081/)

## Authors

* **Andrew Merriman** - *Initial work* - [ACMerriman](https://github.com/ACMerriman)

See also the list of [contributors](https://github.com/ACMerriman/scorigami/graphs/contributors) who participated in this project.

## Acknowledgments

* Data retrieved from [Pro Football Reference](https://www.pro-football-reference.com/)
