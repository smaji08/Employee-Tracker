const mysql = require("mysql");
const inquirer = require("inquirer");
const Table = require ("easy-table");
const password = require ("./lib/password");

require('events').EventEmitter.prototype._maxListeners = 100

var connection = mysql.createConnection({
  host: "localhost",
  port: process.env.PORT || 3306,
  user: "root",
  password: password,
  database: "Employee_DB"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  start();
});

function start(){
    inquirer
        .prompt([{
            name: "action",
            type: "rawlist",
            message: "What would you like to do?",
            choices: [
                "View Employee Details",
                "Add Employee", "View Employee Table",
                "Add Department", "View Department Table",
                "Add Role","View Role Table", 
                "View Employees by Manager", "View total utilized budget of a department",
                "Update Employee Role", "Update Employee Manager",
                "Delete Employee", "Delete Role", "Delete Department",
                "Exit"
            ]
        }])
        .then(function(answer){
            
            switch(answer.action){
                case "View Employee Details":
                    viewAll();
                    break;
                case "Add Employee":
                    addEmp();
                    break;
                case "View Employee Table":
                    view("Employee");
                    break;
                case "Add Department":
                    addDept();
                    break;
                case "View Department Table":
                    view("Department");
                    break;
                case "Add Role":
                    addRole();
                    break;
                case "View Role Table":
                    view("Role");
                    break;
                case "View Employees by Manager":
                    viewByMgr();
                    break;
                case "View total utilized budget of a department":
                    viewUtiBudget();
                    break;
                case "Update Employee Role":
                    updateRole();
                    break;
                case "Update Employee Manager":
                    updateEmpMgr();
                    break;
                case "Delete Employee":
                    deleteEmp();
                    break;
                case "Delete Role":
                    deleteRole();
                    break;
                case "Delete Department":
                    deleteDept();
                    break;
                case "Exit":
                    connection.end();
                    break;
            }
        });
}

//checking with RegEx which allows only alphabets and space for names and school
function validateString(name){
  let re = name.match(/^[a-zA-Z ]+$/);
  return re !== null || "Please enter Alphabets only";
}

//First character of each word of the name or school to be uppercased
function toUpper(val) {
  return val.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
}

//regEx for numbers
function validateNumber(name){
  let re = name.match(/^[0-9]*$/);
  return re !== null || "Please enter Numerics only";
}

function viewAll(){
  const query = `Select e.id empId, e.first_name, e.last_name, r.title, d.name, r.salary, concat(m.first_name, " ", m.last_name) as Manager 
                 FROM employee e 
                 JOIN role r ON e.role_id = r.id
                 JOIN department d ON d.id = r.department_id
                 LEFT JOIN employee m ON m.id = e.manager_id`;
  connection.query(query, (err, res) => {
    console.log("\n", Table.print(res));
    start();
  });
}

function view(tab){
  const query = "SELECT * FROM " + tab;
  connection.query(query,(err, res) => {
    console.log("\n", Table.print(res));
    start();
  });
}

function viewByMgr(){
  const query = `SELECT CONCAT(first_name, " ", last_name) as Mgr 
    FROM Employee where id in (SELECT manager_id from Employee where manager_id IS NOT NULL)`;
  connection.query(query, function(err,results){
    if (err) throw err;
    inquirer
    .prompt([
    {
        name: "Mgr",
        type: "rawlist",
        choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
                choiceArray.push(results[i].Mgr);
            }
            return choiceArray;
            },
        message: "Please choose the Manager.."  
    }
    ])
    .then(function(answer){
        const query = `Select e.id empId, e.first_name, e.last_name, r.title, r.salary 
                        FROM employee e 
                        JOIN role r ON e.role_id = r.id
                        LEFT JOIN employee m ON m.id = e.manager_id
                        WHERE m.first_name = ?`;
        connection.query(query,[answer.Mgr.split(" ")[0]],function(error,res){
            if (error) throw error;
            console.log("\n", Table.print(res));
            start();
        });    
    });
  });
}

function viewUtiBudget(){
  connection.query("SELECT * FROM Department", function(err,results){
    if (err) throw err;
    inquirer
    .prompt([
    {
        name: "Dept",
        type: "rawlist",
        choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
                choiceArray.push(results[i].name);
            }
            return choiceArray;
            },
        message: "Please choose the Department.."  
    }
    ])
    .then(function(answer){
        const query = `select SUM(salary) AS combinedSalary, name from employee e, role r, department d 
        where e.role_id = r.id
        AND r.department_id = d.id
        AND d.name = ?`;
        connection.query(query,[answer.Dept],function(error,res){
            if (error) throw error;
            console.log(`The total utilized budget of ${answer.Dept} is USD ${res[0].combinedSalary}`);
            start();
        });    
    });
  });
}

function addEmp(){
  const query = `Select r.title, concat(m.first_name, " ", m.last_name) as Manager, e.manager_id
                 FROM employee e 
                 RIGHT JOIN role r ON e.role_id = r.id
                 LEFT JOIN employee m ON m.id = e.manager_id;`
  connection.query(query, function(err, results) {
    if (err) throw err;
    inquirer
    .prompt([
    {
        name: "firstName",
        type: "input",
        message: "Please enter the First Name of the employee..",
        validate: validateString,
        filter: toUpper
    },
    {
        name: "lastName",
        type: "input",
        message: "Please enter the Last Name of the employee..",
        validate: validateString,
        filter: toUpper
    },
    {
        name: "role",
        type: "rawlist",
        choices: function() {
            var choiceArray = [];
              for (var i = 0; i < results.length; i++) {
                  choiceArray.push(results[i].title);
              }
            var choiceRoles = [...new Set(choiceArray)];
            return choiceRoles;
            },
        message: "Please select the Role assigned.."
    },
    {
      name: "mgr",
      type: "rawlist",
      choices: function() {
          var choice = ["None"];
            for (var i = 0; i < results.length; i++) {
                if (results[i].Manager !== null)
                choice.push(results[i].Manager);
            }
          var choiceMgr = [...new Set(choice)];
          return choiceMgr;
          },
      message: "Please select the Manager to assign.."
  }
    ])
    .then(function(answer){
        var chosenItem;
        for (var i = 0; i < results.length; i++) {
            if (results[i].Manager === answer.mgr) 
                chosenItem = results[i];
        }
      connection.query("SELECT id from Role where title = ?",[answer.role],
        function(error,res){
            if (error) throw error;
            connection.query(
            "INSERT INTO Employee SET ?",
            {
              first_name: answer.firstName,
              last_name: answer.lastName,
              role_id: res[0].id,
              manager_id: chosenItem?chosenItem.manager_id:null
            },
              function(err){
                if (err) throw err;
                console.log(`Employee ${answer.firstName}, ${answer.lastName} is added successfully`);
                viewAll();
              }    
            );    
      });
    });
  });
}

function addDept(){
    inquirer
        .prompt([
        {
            name: "deptName",
            type: "input",
            message: "Please enter the Name of the Department..",
            validate: validateString,
            filter: toUpper
        }
        ])
        .then(function(answer){
            connection.query(
            "INSERT INTO Department SET ?", {name: answer.deptName},
                function (err){
                  if(err) throw err;
                  console.log(`Department ${answer.deptName} added successfully!`);
                  view("Department");
                }
            )
        });
}

function addRole(){
  connection.query("SELECT * FROM Department", function(err, results) {
    if (err) throw err;
    inquirer
        .prompt([
        {
            name: "roleName",
            type: "input",
            message: "Please enter the Role you want to add..",
            validate: validateString,
            filter: toUpper
        },
        {
            name: "salary",
            type: "input",
            message: "Enter the salary for this role..",
            validate: validateNumber
        },
        {
            name: "deptName",
            type: "rawlist",
            choices: function (){
                var choiceArray = [];
                for (var i = 0; i < results.length; i++) {
                    choiceArray.push(results[i].name);
                }
                return choiceArray;
            },
             message: "Please select the Department assigned.."
        }
        ])
        .then(function(answer){
          connection.query("SELECT id from Department where name = ?",[answer.deptName],
            function(error,res){
            if (error) throw error;
            connection.query(
            "INSERT INTO Role SET ?",
            {
              title: answer.roleName,
              salary: answer.salary,
              department_id: res[0].id
            },
              function(err){
                if (err) throw err;
                console.log(`Role ${answer.roleName} is added successfully`);
                view("Role");
              }    
            );    
          });
        });
  });
}

function updateRole(){
    connection.query(`SELECT  title, r.id roleId, e.id empId, first_name, last_name
        FROM Role r LEFT JOIN Employee e ON e.role_id = r.id`, function(err, results) {
      if (err) throw err;
      inquirer
          .prompt([
          {
              name: "empName",
              type: "rawlist",
              choices: function (){
                var choiceArray = [];
                for (var i = 0; i < results.length; i++) {
                    if (results[i].empId !== null)
                    choiceArray.push(results[i].first_name + " " + results[i].last_name);
                }
                return choiceArray;
              },
             message: "Please select the Employee whose role need to be updated.."
          },
          {
              name: "roleName",
              type: "rawlist",
              choices: function (){
                  var choice = [];
                  for (var i = 0; i < results.length; i++) {
                    choice.push(results[i].title);
                  }
                  var choiceDist = [...new Set(choice)];
                  return choiceDist;
              },
               message: "Please select the Role to assign.."
          }
          ])
          .then(function(answer){
              const query = `UPDATE Employee SET role_id =
                (SELECT id FROM Role WHERE title = ?)
                WHERE first_name= ? AND last_name= ?`;
              connection.query(query,
                [answer.roleName, answer.empName.split(" ")[0], answer.empName.split(" ").splice(1).join(" ")],
                function(error){
                  if (error) throw error;
                    console.log(`Updated ${answer.empName}'s Role to ${answer.roleName} successfully`);
                    viewAll();
                }    
              );    
            });
          });
}

function updateEmpMgr(){
    const query = `Select e.id empId, CONCAT(e.first_name, " ", e.last_name) as EmpName, r.title, concat(m.first_name, " ", m.last_name) as Manager, e.manager_id
                    FROM employee e 
                    JOIN role r ON e.role_id = r.id
                    LEFT JOIN employee m ON m.id = e.manager_id`;
    connection.query(query, function(err, results) {
        if (err) throw err;
        inquirer
        .prompt([
        {
            name: "empName",
            type: "rawlist",
            choices: function (){
                var choiceArray = [];
                for (var i = 0; i < results.length; i++) {
                    if (!(results[i].title).startsWith("Manager"))
                    choiceArray.push(results[i].EmpName);
                }
                return choiceArray;
            },
            message: "Please select the Employee whose Manager needs to be updated.."
        },
        {
            name: "mgrName",
            type: "rawlist",
            choices: function (){
                var choice = ["None"];
                for (var i = 0; i < results.length; i++) {
                    if((results[i].title).startsWith("Manager"))
                    choice.push(results[i].EmpName);
                }
                return choice;
            },
            message: "Please select the new Manager to be assigned.."
        }
        ])
        .then(function(answer){
            var chosenItem;
            for (var i = 0; i < results.length; i++) {
                if (results[i].EmpName === answer.mgrName) 
                    chosenItem = results[i];
            }
            const query = `UPDATE Employee 
                           SET manager_id = ?
                           WHERE first_name= ? AND last_name= ?`;
            connection.query(query, [ chosenItem?chosenItem.empId:null, answer.empName.split(" ")[0], answer.empName.split(" ").splice(1).join(" ")],
                function(error){
                if (error) throw error;
                    console.log(`Updated ${answer.empName}'s Manager to ${chosenItem?chosenItem.EmpName:null} successfully`);
                    viewAll();
                }    
            );    
            });
        });

}

function deleteEmp(){
  connection.query("SELECT * FROM Employee",function(err, results){
    inquirer
      .prompt([
      {
          name: "emp",
          type: "rawlist",
          choices: function (){
              var choiceArray = [];
              for (var i = 0; i < results.length; i++) {
                  choiceArray.push(results[i].id + " " + results[i].first_name + " " + results[i].last_name);
              }
              return choiceArray;
          },
          message: "Please select the Employee to be deleted.."
      }
    ])
    .then(function(answer){
        const query = "DELETE FROM Employee Where id = ? AND first_name = ? AND last_name = ?";
        connection.query(query,[answer.emp.split(" ")[0], answer.emp.split(" ")[1], answer.emp.split(" ").splice(2)],
            function(err){
              if (err) throw err;
              console.log(`Deleted ${answer.emp.split(" ")[1]} ${answer.emp.split(" ").splice(2)} Successfully`);
              viewAll();
        });
    });  
  });
}

function deleteRole(){
  connection.query("SELECT * FROM Role",function(err, results){
    inquirer
      .prompt([
      {
          name: "role",
          type: "rawlist",
          choices: function (){
              var choiceArray = [];
              for (var i = 0; i < results.length; i++) {
                  choiceArray.push(results[i].title);
              }
              return choiceArray;
          },
          message: "Please select the Role to be deleted.."
      }
    ])
    .then(function(answer){
        const query = "DELETE FROM Role Where title = ?";
        connection.query(query,[answer.role],
            function(err){
              if (err) throw err;
              console.log(`Deleted ${answer.role} Successfully`);
              view("Role");
        });
    });  
  });
}

function deleteDept(){
  connection.query("SELECT * FROM Department",function(err, results){
    inquirer
      .prompt([
      {
          name: "dept",
          type: "rawlist",
          choices: function (){
              var choiceArray = [];
              for (var i = 0; i < results.length; i++) {
                  choiceArray.push(results[i].name);
              }
              return choiceArray;
          },
          message: "Please select the Department to be deleted.."
      }
    ])
    .then(function(answer){
        const query = "DELETE FROM Department Where name = ?";
        connection.query(query,[answer.dept], function(err){
              if (err) throw err;
              console.log(`Deleted ${answer.dept} Successfully`);
              view("Department");
        });
    });  
  });
}