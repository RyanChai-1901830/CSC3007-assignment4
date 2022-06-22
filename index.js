let width = 800,
    height = 800;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height)

// Load external data
Promise.all([d3.json("https://chi-loong.github.io/CSC3007/assignments/links-sample.json"), d3.json("https://chi-loong.github.io/CSC3007/assignments/cases-sample.json")]).then(data => {

    // Data preprocessing
    data[0].forEach(e => {
        e.source = e.infector;
        e.target = e.infectee;
    });

    console.log(data[0]); //links
    console.log(data[1]); //cases

    // Split the main dataset into 2, each being a cluster on its own
    // Add additional attibute into each of data[1], for splitting purpose 
    var i = 0;
    data[1].forEach(e => {
        if (i < 10) {
            e.group = 0;
        } else {
            e.group = 1;
        }
        e.images = "https://github.com/favicon.ico";
        i++;
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    // Color scale for male & female
    let colorScale = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["pink", "blue"]);
    // Position of the 2 cluster
    var x = d3.scaleOrdinal()
        .domain([0, 1])
        .range([200, 600]);
    // Position for the vaccinated
    var xPosition = d3.scaleOrdinal()
        .domain([0, 1, 2])
        .range([100, 300, 600]);

    // Create link for each nodes using data[0]
    let linkpath = svg.append("g")
        .attr("id", "links")
        .selectAll("path")
        .data(data[0])
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "black");

    // create a tooltip
    var Tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "lightgreen")
        .style("border", "solid")
        .style("border-color", "red")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

    // Create mouse over function to display tooltip
    var mouseover = function(d) {
        Tooltip.style("opacity", 1);
        d3.select(this)
            .style("stroke", "red")
            .style("opacity", 1)
            .style("stroke-width", 3);
    };

    // Create mouse move function & display tool tip
    var mousemove = function(d, i) {
        let pos = d3.select(this).node().getBoundingClientRect();
        Tooltip.html("<h6>" + "id: " + i.id + "</h6>" +
                "<h6>" + "Age: " + i.age + "</h6>" +
                "<h6>" + "Gender: " + i.gender + "</h6>" +
                "<h6>" + "Nationality: " + i.nationality + "</h6>" +
                "<h6>" + "Occupation: " + i.occupation + "</h6>" +
                "<h6>" + "Organization: " + i.organization + "</h6>" +
                "<h6>" + "Date: " + i.date + "</h6>" +
                "<h6>" + "Vaccinated: " + i.vaccinated + "</h6>"
            )
            .style('left', `${(window.pageXOffset  + pos['x'] + 50)}px`)
            .style('top', `${(window.pageYOffset  + pos['y'] + 50)}px`);
    };
    // On mouse, remove tooltip
    var mouseleave = function(d) {
        Tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
    };


    var node = svg.append("g")
        .attr("id", "nodes")
        .selectAll("circle")
        .data(data[1])
        .enter()
        .append("circle")
        .attr("r", 20)
        .style("fill", d => colorScale(d.gender))
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))


    // var node = svg.append("g")
    //     .attr("id", "nodes")
    //     .selectAll("circle")
    //     .data(data[1])
    //     .enter()
    //     .append("circle")
    //     .attr("r", 20)
    //     .style("fill", d => colorScale(d.gender))
    //     .on("mouseover", mouseover)
    //     .on("mousemove", mousemove)
    //     .on("mouseleave", mouseleave)
    //     .call(d3.drag()
    //         .on("start", dragstarted)
    //         .on("drag", dragged)
    //         .on("end", dragended))

    let image = node.append("svg:image")
        .attr("x", 0)
        .attr("y", 0)
        .attr('width', 100)
        .attr('height', 100)
        .attr("xlink:href", "https://github.com/favicon.ico")
        // node.append("image")
        //     .attr("xlink:href", "https://github.com/favicon.ico")
        //     .attr("x", 0)
        //     .attr("y", 0)
        //     .attr("width", 100)
        //     .attr("height", 100);

    let simulation = d3.forceSimulation()
        .nodes(data[1])
        .force("x", d3.forceX().strength(0.1).x(function(d) { return x(d.group) }))
        .force("y", d3.forceY().strength(0.1).y(height / 4))
        .force("link", d3.forceLink(data[0])
            .id(d => d.id)
            .distance(100)
            .strength(0.1))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("collide", d3.forceCollide().strength(0.1).radius(50))
        .on("tick", d => {
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            linkpath
                .attr("d", d => "M" + d.source.x + "," + d.source.y + " " + d.target.x + "," + d.target.y);


        });

    d3.select("#cluster").on("click", function() {
        simulation
            .force("x", d3.forceX().strength(0.1).x(function(d) { return x(d.group) }))
            .force("y", d3.forceY().strength(0.1).y(height / 4))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("collide", d3.forceCollide().strength(0.1).radius(50))
            .alphaTarget(0.3)
            .restart();
    })

    d3.select("#vaccination_status").on("click", function() {
        simulation
            .force("x", d3.forceX().strength(0.5).x(d => xPosition(d.vaccinated)))
            .force("y", d3.forceY().strength(0.2).y(height / 4))
            .force("charge", d3.forceManyBody().strength(-50))
            .force("collide", d3.forceCollide().strength(0.1).radius(50))
            .alphaTarget(0.3)
            .restart();
    })

})