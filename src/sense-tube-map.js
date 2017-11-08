define( [
	"qlik",
	"./tube-map-viz.min"

],
function ( qlik ) {
	return {
		initialProperties: {
			qHyperCubeDef: {
        qStateName: "$"
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
        dimensions:{
          uses: "dimensions",
          min: 2
        },
        measures:{
          uses: "measures",
          min: 0
        }
      }
    },
    controller: function($scope){
			$scope.currApp = qlik.currApp();
      $scope.baseObject;
      $scope.baseObjectLayout;
      $scope.dimensionCount;
      $scope.measureCount;
      $scope.session;
      $scope.mapViz = new window.TubeMapViz({
        stationRadius: 15,
        stationThickness: 10,
        lineWidth: 8,
        lineSpacing: 8,
        fontSize: 14,
				stationClicked: function(station){
					$scope.$parent.backendApi.selectValues(1, [station.elemNum], true)
				}
      });
      $scope.origHandle = $scope.$parent.backendApi.model.handle;
      include "./copy-object.js"
      include "./get-all-data.js"
			include "./render.js"
    },
    paint: function(element, layout){
      var that = this;
      if(this._inEditState===true){
        element[0].style.zIndex = -1;
				element[0].parentElement.parentElement.parentElement.style.backgroundColor = "transparent";
      }
      else {
        element[0].style.zIndex = null;
				element[0].parentElement.parentElement.parentElement.style.backgroundColor = "inherit";
      }
      if(this.$scope.baseObject && this._inEditState===false){
        this.$scope.renderMap(element, layout);
      }
      else{
        this.$scope.copyObject(function(){
          that.$scope.renderMap(element, layout);
        });
      }
    }
  }
});
