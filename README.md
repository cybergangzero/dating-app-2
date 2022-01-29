# majorandminor!
-First and foremost, make sure you have nodejs and postgresql installed on your operating system. This application was 
tested on a debian 9 operating system with node version 14.15.0 and postgresql version 13.1 
-Next, make sure to create an .env file with the following parameters:
DB_USER=yourDatabaseUser
DB_DATABASE=yourDatabase
DB_PASSWORD=yourPassword
DB_HOST=localhost


-Then, create the directory "users-photos" in the root directory of the application


-Install dependencies (npm install)


-Next, create the database using the "db.js" file found in your archive directory by running the command "node db.js"


-Run the application with "node app.js", open the browser and go to localhost:5000 
