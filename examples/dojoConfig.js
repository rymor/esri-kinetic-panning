var dojoConfig = {
	parseOnLoad : true,
	async : true,
	packages : [{
		"name" : "utils",
		"location" : location.pathname.replace(/\/[^/]+\/[^/]+$/, "") + "/src/utils"
	}]
};

