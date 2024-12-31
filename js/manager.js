function validateForm() {

    var regEmail = /^\S+@\S+\.\S+$/;

    //email validity check: not null and correct format
    var email = document.getElementById("email");
    if (email.value == "" || !email.value.match(regEmail)) {
        alert("Email is required, please check if the email is valid (CORROECT FORMAT: name@domain.com)");
        return false;
    }


}


//function clear will clear all inputs
function clearAll() {
    document.getElementById("email").value ="";
}


//function start will add event listener to activate submit button and clear button
function start() {

    var submitButton = document.getElementById("submitButton");
    submitButton.addEventListener("click", validateForm, false);
    

    var clearButton = document.getElementById("clearButton");
    clearButton.addEventListener("click", clearAll, false);

}
window.addEventListener("load", start, false);
