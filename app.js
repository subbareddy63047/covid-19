const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

const initializeAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error:${error.message}`);
    process.exit(1);
  }
};

initializeAndServer();

//API1

app.get("/states/", async (request, response) => {
  const stateDetails = `
    select * from state
    order by state_id;`;
  const results = await db.all(stateDetails);
  //console.log(results);
  function convertDbObjectToResponseObject(dbObject) {
    let array = [];
    for (let each of dbObject) {
      array.push({
        stateId: each.state_id,
        stateName: each.state_name,
        population: each.population,
      });
    }
    return array;
  }
  finalResults = convertDbObjectToResponseObject(results);
  //console.log(finalResults);
  response.send(finalResults);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  //console.log(stateId);
  const particularStateDetails = `
    select * from state
    where state_id=${stateId};`;
  const results = await db.get(particularStateDetails);
  const resultsToFinalResults = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  finalResults = resultsToFinalResults(results);
  response.send(finalResults);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  //console.log(stateId);
  const postedDetails = `
insert into district(
    district_name,state_id,cases,cured,active,deaths
) 
values(
    "${districtName}",
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;

  const results = await db.run(postedDetails);
  const disId = results.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const particularDistrictDetails = `
    select * from district
    where district_id=${districtId};`;
  const results = await db.get(particularDistrictDetails);
  const functionForFInalResults = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  const finalResults = functionForFInalResults(results);
  response.send(finalResults);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDetails = `
    delete from district
    where district_id=${districtId};`;
  const results = await db.run(deleteDistrictDetails);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const updates = `
    update district
    set
        district_name="${districtName}",
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    where district_id=${districtId};`;
    const results = await db.run(updates);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`put Error:${e.message}`);
  }
});

app.get("/states/:stateId/stats", async (request, response) => {
  try {
    const { stateId } = request.params;
    const stateQuery = `
    select 
    sum(cases) as totalCases ,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    from district
    where state_id=${stateId};`;
    const results = await db.get(stateQuery);
    response.send(results);
  } catch (error) {
    console.log(`API7 ERROR:${error.message}`);
  }
});

app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const stateDetails = `
select state_name 
from state natural join district 
where district_id=${districtId};`;
    const results = await db.get(stateDetails);
    const subbaReddy = (dbObject) => {
      return {
        stateName: dbObject.state_name,
      };
    };

    const finalResults = subbaReddy(results);
    response.send(finalResults);
  } catch (error) {
    console.log(`API8 Error:${error.message}`);
  }
});

module.exports = app;
