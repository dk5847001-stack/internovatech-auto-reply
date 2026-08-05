const brevo = require("@getbrevo/brevo");



const LOGO_URL =
"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXsfCtQ07icafhDTAW7Y17qVGYgNzky_kaqsKugCvi4ewKepdc9k7TYXOD-YrWA38oGxqsdnNtqXYWFw_3ze0ngn78_puqlb3c647OHdFNT7UgPL72_Im5zdJB0L-YT3PQQTzi7QpD68lm-OXiZsAMnymD3OgeDzLjwmhrkkLjwhXFPfSudsCiF7Pg1Yib/s2560/1000070116.png";





const apiInstance =
new brevo.TransactionalEmailsApi();





apiInstance.setApiKey(

brevo.TransactionalEmailsApiApiKeys.apiKey,

process.env.BREVO_API_KEY

);









function textValue(value){

if(!value)
return "";

if(typeof value==="object"){

return String(

value.message ||
value.text ||
value.body ||
""

);

}


return String(value);

}







function escapeHtml(value){

return textValue(value)

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;")

.replace(/"/g,"&quot;")

.replace(/'/g,"&#039;");

}









function createTemplate(content){


return `

<!DOCTYPE html>

<html>

<body style="
margin:0;
padding:20px;
background:#f4f7fb;
font-family:Arial,Helvetica,sans-serif;
">


<table width="600"
align="center"
style="
background:white;
border-radius:15px;
overflow:hidden;
">


<tr>

<td align="center"

style="
background:#111827;
padding:25px;
">


<img

src="${LOGO_URL}"

width="85"

style="
border-radius:50%;
">


<h2 style="
color:white;
">

InternovaTech 🚀

</h2>


<p style="
color:#d1d5db;
">

AI Support Assistant

</p>


</td>

</tr>





<tr>

<td style="
padding:30px;
color:#374151;
font-size:15px;
line-height:1.7;
">


${content}


<br>


<p>

Regards,<br>

<b>
InternovaTech Support Team
</b>

</p>


</td>


</tr>






<tr>

<td align="center"

style="
background:#111827;
color:white;
padding:20px;
font-size:13px;
">


<b>
InternovaTech
</b>


<br>

info@internovatech.in

<br>

www.internovatech.in


</td>


</tr>



</table>


</body>

</html>

`;

}









async function sendMail({

to,

subject,

text,

inReplyTo=null

}){


try{


const message =
textValue(text);



const email =

new brevo.SendSmtpEmail();





email.sender={


name:

process.env.BREVO_NAME || 
"InternovaTech Support",


email:

process.env.BREVO_EMAIL

};





email.to=[

{

email:to

}

];





email.subject=subject;



email.textContent=
message;



email.htmlContent=

createTemplate(`


<p>Hello,</p>


<p>

${escapeHtml(message).replace(/\n/g,"<br>")}

</p>


`);







if(inReplyTo){


email.headers={

"In-Reply-To":inReplyTo,

"References":inReplyTo

};


}







const result =

await apiInstance.sendTransacEmail(

email

);





console.log(

"📤 Brevo API Email Sent:",

result.messageId || "success"

);





return result;



}

catch(error){


console.error(

"❌ Brevo API Error:",

error.response?.body || error.message

);


throw error;


}



}





module.exports =
sendMail;