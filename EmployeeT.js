//Dependencies
const inquirer = require("inquirer");
var mysql = require("mysql");
var connection;
var roles = [];
var employees = [];
var departments = [];

//Starting
mainMenu();

//Main Menu (Asks for table to be managed and operation to be perfomed)
function mainMenu() {
    console.log('\n ***** Hi! Welcome to Employee Tracker App! *****\n');
    connectMySQL();
    getRoles();
    getDepartments();
    getEmployees();
    var questions = [{
        type: 'list',
        name: 'tableName',
        message: "What table do you want to operate on ?",
        choices: ['Employee', 'Role', 'Department']
    },
    {
        type: 'list',
        name: 'operation',
        message: "What operation do you want to perform on this table ?",
        choices: ['Select', 'Insert', 'Update', 'Delete']
    }
    ];
    inquirer.prompt(questions).then((answers) => {
        if (answers.operation === "Select") {
            selectOperation(answers.tableName);
        } else if (answers.operation === "Insert") {
            insertOperation(answers.tableName);
        } else if (answers.operation === "Delete") {
            deleteOperation(answers.tableName);
        } else if (answers.operation === "Update") {
            updateOperation(answers.tableName);
        }
        return;
    });
}

//My SQL Connection
function connectMySQL() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'PHMR',
        port: 3306,
        password: 'Udi07phMt!PHMR',
        database: 'bcs'
    });
    connection.connect(function (err) {
        if (err) {
            console.log("Error on connecting MySQL. " + err);
        }
    });
}

//Select queries for all tables
function selectOperation(tableName) {
    var selectQuery = "select * from " + tableName;
    if (tableName === "Role") {
        selectQuery = "select r.id, r.title, r.salary, d.name as department from role r inner join department d on r.department_id = d.id";
    } else if (tableName === "Employee") {
        selectQuery = "select e.id, concat(e.first_name,concat(' ',e.last_name)) as full_name, d.name as department, r.title as role_title, r.salary, " +
            "concat(m.first_name,concat(' ',m.last_name)) as manager from employee e " +
            "inner join role r on e.role_id = r.id " +
            "inner join department d on r.department_id = d.id " +
            "left join employee m on e.manager_id = m.id";
    }
    connection.query(selectQuery, function (err, res) {
        if (err) throw err;
        showReport(res);
        connection.end();
    });
}

//Insert Operations for all tables
function insertOperation(tableName) {
    var questions = getFiedQuestions(tableName);
    inquirer.prompt(questions).then((answers) => {
        var query = connection.query("INSERT INTO " + tableName + " SET ?", answers, function (err, res) {
            if (err) throw err;
            console.log("\nRecord inserted successfully with ID number " + res.insertId + ".\n");
            connection.end();
        });
    });
}

//Delete Operations for all tables
function deleteOperation(tableName) {
    var questions = [{
        type: 'list',
        name: 'id',
        message: "Choose " + tableName + " to be deleted:",
        choices: tableName === "Employee" ? employees : tableName === "Department" ? departments : roles
    }];
    inquirer.prompt(questions).then((answers) => {
        var query = connection.query("DELETE FROM " + tableName + " WHERE ?", answers, function (err, res) {
            if (err) throw err;
            console.log("\nNumber of records deleted: " + res.affectedRows + ".\n");
            connection.end();
        });
    });
}

//Update Operations for all tables
function updateOperation(tableName) {
    var questions = [{
        type: 'list',
        name: 'id',
        message: "Choose " + tableName + " to be updated:",
        choices: tableName === "Employee" ? employees : tableName === "Department" ? departments : roles
    }];
    inquirer.prompt(questions).then((answers) => {
        var id = answers.id;
        var questions = getFiedQuestions(tableName);
        inquirer.prompt(questions).then((answers) => {
            var query = connection.query("UPDATE " + tableName + " SET ? WHERE ?", [answers, { "id": id }], function (err, res) {
                if (err) throw err;
                console.log("\nRecord successfully updated!\n");
                connection.end();
            });
        });
    });
}

//Shows Report (Create a dynamic report based on column names from the query)
function showReport(rows) {
    var header = [];
    var headerSep = [];
    if (rows.length === 0) {
        console.log("\nNo records found in this table!\n");
        return;
    }
    for (colName in rows[0]) {
        var nSpaces = colName === "id" ? 5 : 30;
        header.push(colName.padEnd(nSpaces, " "));
        headerSep.push("".padEnd(nSpaces, "-"));
    }
    console.log("\n" + header.join("  "));
    console.log(headerSep.join("  "));
    for (row of rows) {
        var rowValues = [];
        header.forEach((colName) => {
            var colValue = String(row[colName.trim()]).padEnd(colName.length, " ");
            rowValues.push(colValue);
        });
        console.log(rowValues.join("  "));
    }
    console.log("\n");
}

//Fills array of roles to be used as input list
function getRoles() {
    var selectQuery = "Select id, title from role order by title";
    connection.query(selectQuery, function (err, res) {
        if (err) throw err;
        roles = [];
        for (row of res) {
            roles.push({ name: row.title, value: row.id });
        }
    });
}

//Fills array of departments to be used as input list
function getDepartments() {
    var selectQuery = "Select id, name from department order by name";
    connection.query(selectQuery, function (err, res) {
        if (err) throw err;
        departments = [];
        for (row of res) {
            departments.push({ name: row.name, value: row.id });
        }
    });
}

//Fills array of employees to be used as input list
function getEmployees() {
    var selectQuery = "Select id, concat(first_name,concat(' ',last_name)) as full_name from employee order by first_name";
    connection.query(selectQuery, function (err, res) {
        if (err) throw err;
        employees = [{ name: 'None', value: null }];
        for (row of res) {
            employees.push({ name: row.full_name, value: row.id });
        }
    });
}

//Get input labels/entry field for a specific table
function getFiedQuestions(tableName) {
    var questions;
    if (tableName === "Department") {
        questions = [{
            type: 'input',
            name: 'name',
            message: "Department Name: ",
            validate: function (value) {
                if (value.length > 0) {
                    return true;
                } else {
                    return 'Please enter a valid name (At least 1 character)!';
                }
            }
        }];
    } else if (tableName === "Role") {
        questions = [{
            type: 'input',
            name: 'title',
            message: "Role Title: ",
            validate: function (value) {
                if (value.length > 0) {
                    return true;
                } else {
                    return 'Please enter a valid name (At least 1 character)!';
                }
            }
        },
        {
            type: 'number',
            name: 'salary',
            message: "Role Salary: ",
            validate: function (value) {
                if (value) {
                    return true;
                } else {
                    return 'Please enter a valid amount!';
                }
            }
        },
        {
            type: 'list',
            message: 'Department: ',
            name: 'department_id',
            choices: departments
        }
        ];
    } else if (tableName === "Employee") {
        questions = [{
            type: 'input',
            name: 'first_name',
            message: "First Name: ",
            validate: function (value) {
                if (value.length > 0) {
                    return true;
                } else {
                    return 'Please enter a valid name (At least 1 character)!';
                }
            }
        },
        {
            type: 'input',
            name: 'last_name',
            message: "Last Name: ",
            validate: function (value) {
                if (value.length > 0) {
                    return true;
                } else {
                    return 'Please enter a valid name (At least 1 character)!';
                }
            }
        },
        {
            type: 'list',
            message: 'Role: ',
            name: 'role_id',
            choices: roles
        },
        {
            type: 'list',
            message: 'Manager: ',
            name: 'manager_id',
            choices: employees
        }
        ];
    }
    return questions;
}