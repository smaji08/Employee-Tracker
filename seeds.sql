USE Employee_DB;

INSERT INTO Department (name)
VALUES ("Sales"),("SCM"),("Production"),("Finance"),("DummyDept1"),("DummyDept2"),("DummyDept3"),("DummyDpet4");

INSERT INTO Role (title, salary, department_id) 
VALUES ("Manager", 80000, 1), ("Executive-1", 70000, 2), ("Accountant-1", 75000, 4),("Executive-2", 70000, 3), ("Accountant-2", 75000, 7),
("Manager-2", 790000, 6), ("Accountant-3", 75000, 5), ("Executive-dummy", 70000, 7), ("Accountant-dummy", 75000, 8);

INSERT INTO Employee (first_name, last_name, role_id)
VALUES ("Matt", "Wing", 2), ("Nick", "Monteleone", 3), ("Augustine", "Stella Maria", 4), ("Mattdummy", "Wing", 6), ("Nickdummy", "Monteleone", 7), 
("Augustinedummy", "Stella Maria", 8), ("rekha","dummy",9); 

select * from department;
select * from role;
select * from employee;

UPDATE Employee 
SET manager_id= 3
WHERE first_name = "Augustinedummy";


Drop table department;


delete from Employee where id= 6;
delete from Role where id= 4;
delete from Department where id= 4;

SET SQL_SAFE_UPDATES = 0;

-- View all Employee Details -- 
Select e.id empId, e.first_name, e.last_name, r.title, d.name, r.salary, concat(m.first_name, " ", m.last_name) as Manager 
FROM employee e 
JOIN role r ON e.role_id = r.id
JOIN department d ON d.id = r.department_id
LEFT JOIN employee m ON m.id = e.manager_id;

-- update employee managers-- 
UPDATE Employee 
SET manager_id= 7
WHERE first_name = "Dave";

-- to update manager for an employee
Select e.id empId, CONCAT(e.first_name, " ", e.last_name) as EmpName, r.title, concat(m.first_name, " ", m.last_name) as Manager, e.manager_id
FROM employee e 
JOIN role r ON e.role_id = r.id
LEFT JOIN employee m ON m.id = e.manager_id;


-- to choose roles and managers while adding a new employee 
Select r.title, concat(m.first_name, " ", m.last_name) as Manager, e.manager_id
FROM employee e 
RIGHT JOIN role r ON e.role_id = r.id
LEFT JOIN employee m ON m.id = e.manager_id;



-- update employee roles--  
UPDATE Employee
SET role_id=2
WHERE first_name="Augustine";

UPDATE Employee
SET role_id = (SELECT id from Role Where title = "Engineer")
Where first_name = "Augustine" AND last_name="Stella Maria";

select first_name, last_name, title from employee inner join role on employee.role_id = role.id;

-- View Employees by Manager -- 
SELECT Employee.first_name AS Emp, Employee.role_id, Manager.first_name AS Mgr 
FROM Employee Manager INNER JOIN Employee 
WHERE Employee.manager_id = Manager.id
GROUP BY Mgr;

-- #2
SELECT e.first_name, e.last_name, e.role_id, m.first_name AS Mgr 
FROM Employee m INNER JOIN Employee e
WHERE e.manager_id = m.id AND m.first_name = "Rajeev";
-- GROUP BY Mgr;

-- #3
Select e.id empId, e.first_name, e.last_name, r.title, r.salary 
FROM employee e 
JOIN role r ON e.role_id = r.id
LEFT JOIN employee m ON m.id = e.manager_id
WHERE m.first_name = "Rajeev";

select CONCAT(first_name, " ", last_name) as Mgr from employee where id in (Select manager_id from employee where manager_id is not null);

-- Delete rows from tables -- 
DELETE FROM Employee Where id = 4;
DELETE FROM Role Where title = "Artist";
DELETE FROM Department WHERE name = "IT";

-- Combined salaries of all employees in a particular dept -- 
select role_id, SUM(salary) AS combinedSalary, department_id, name from employee e, role r, department d 
where e.role_id = r.id
AND r.department_id = d.id
AND d.name = "Production"
GROUP BY d.name;
