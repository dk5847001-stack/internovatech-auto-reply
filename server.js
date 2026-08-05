require("dotenv").config();


const connectDB = require("./config/db");

const startMailListener = require("./services/mailListener");



(async()=>{


try{


console.log(
"🚀 Starting InternovaTech Auto Reply Bot..."
);



await connectDB();



await startMailListener();



}
catch(error){


console.error(
"❌ Server Error:",
error.message
);


}


})();