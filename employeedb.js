var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require ("easy-table");
var password = require ("./password");

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
        .prompt({
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
        })
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
                    // viewByMgr();
                    break;
                case "View total utilized budget of a department":
                    // viewUtiBudget();
                    break;
                case "Update Employee Role":
                    updateRole();
                    break;
                case "Update Employee Manager":
                    // updateEmpMgr();
                    break;
                case "Delete Employee":
                // deleteEmp();
                    break;
                case "Delete Role":
                // deleteRole();
                    break;
                case "Delete Department":
                    // deleteDept();
                    break;
                case "Exit":
                    connection.end();
                    break;
            }
        });
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
  connection.query(query, (err, res) => {
    console.log("\n", Table.print(res));
    start();
  });
}

function addEmp(){
  connection.query("SELECT * FROM Role", function(err, results) {
    if (err) throw err;
    inquirer
    .prompt([
    {
        name: "firstName",
        type: "input",
        message: "Please enter the First Name of the employee.."
    },
    {
        name: "lastName",
        type: "input",
        message: "Please enter the Last Name of the employee.."
    },
    {
        name: "role",
        type: "rawlist",
        choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
                choiceArray.push(results[i].title);
            }
            return choiceArray;
            },
        message: "Please select the Role assigned.."
    }
    ])
    .then(function(answer){
      connection.query("SELECT id from Role where title = ?",[answer.role],
        function(error,res){
            if (error) throw error;
            connection.query(
            "INSERT INTO Employee SET ?",
            {
              first_name: answer.firstName,
              last_name: answer.lastName,
              role_id: res[0].id
            },
              function(err){
                if (err) throw err;
                console.log(`Employee ${answer.firstName}, ${answer.lastName} is added successfully`);
                view("Employee");
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
            message: "Please enter the Name of the Department.."
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
            message: "Please enter the Role you want to add.."
        },
        {
            name: "salary",
            type: "input",
            message: "Enter the salary for this role.."
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
             message: "Please select the Role assigned.."
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
                [answer.roleName, answer.empName.split(" ")[0], answer.empName.split(" ")[1]],
                function(error){
                  if (error) throw error;
                    console.log(`Role ${answer.roleName} is added successfully`);
                    view("Employee");
                }    
              );    
            });
          });
}