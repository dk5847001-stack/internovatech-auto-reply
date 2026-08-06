require("dotenv").config();

const path = require("path");
const express = require("express");

const connectDB = require("./config/db");
const startMailListener = require("./services/mailListener");


const app = express();

const PORT = process.env.PORT || 5000;



// Middleware
app.use(express.json());
app.use(
    "/assets",
    express.static(path.join(__dirname, "public", "assets"), {
        immutable: true,
        maxAge: "7d"
    })
);



// Health Check
app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        service: "InternovaTech Auto Reply Bot",

        status: "Running 🚀"

    });

});





// Health API
app.get("/health", (req, res) => {

    res.status(200).json({

        uptime: process.uptime(),

        status: "OK"

    });

});







async function startServer(){


    try{


        console.log(
            "🚀 Starting InternovaTech Auto Reply Bot..."
        );



        // Start Express First

        app.listen(PORT, ()=>{

            console.log(
                `🌐 Server running on port ${PORT}`
            );

        });




        // Database

        await connectDB();



        console.log(
            "🗄️ Database Connected"
        );





        // Email Listener

        await startMailListener();



        console.log(
            "📩 Mail Listener Started"
        );




    }


    catch(error){


        console.error(
            "❌ Startup Error:",
            error
        );


        process.exit(1);

    }


}







// Graceful Shutdown

process.on(
    "SIGTERM",
    ()=>{

        console.log(
            "SIGTERM received. Closing..."
        );


        process.exit(0);

    }
);



process.on(
    "SIGINT",
    ()=>{

        console.log(
            "Server stopped"
        );


        process.exit(0);

    }
);






startServer();
