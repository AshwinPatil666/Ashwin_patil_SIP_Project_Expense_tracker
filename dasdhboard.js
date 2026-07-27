const search = document.getElementById("search");
const results = document.getElementById("search-results");

const pages = [

    {name:"Dashboard", url:"dashboard.html"},
    {name:"Expenses", url:"expense.html"},
    {name:"Budget", url:"budget.html"},
    {name:"AI Insights", url:"ai_insight.html"},
    {name:"OCR Scanner", url:"ocr.html"},
    {name:"Reports", url:"report.html"},
    {name:"Settings", url:"#"},
    {name:"Logout", url:"#"},
    {name:"History",url:""}
];

search.addEventListener("input", function(){

    const value = search.value.toLowerCase().trim();

    results.innerHTML = "";

    if(value === ""){

        results.style.display = "none";
        return;

    }

    const filtered = pages.filter(page =>
        page.name.toLowerCase().includes(value)
    );

    if(filtered.length === 0){

        results.style.display = "none";
        return;

    }

    filtered.forEach(page=>{

        const link = document.createElement("a");

        link.href = page.url;

        link.textContent = page.name;

        results.appendChild(link);

    });

    results.style.display = "block";

});

document.addEventListener("click", function(e){

    if(!e.target.closest(".search")){

        results.style.display="none";

    }

});