define( [
	"./tube-map-viz.min"
],
function ( T ) {

	return {
		initialProperties: {
			version: 1.0,
      qInfo: {
        qType: "Chart"
      },
			qHyperCubeDef: {
        qStateName: "$",
				qDimensions: [],
				qMeasures: []
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
      $scope.baseObjectHandle;
      $scope.baseObjectLayout;
      $scope.dimensionCount;
      $scope.measureCount;
      $scope.session;
      $scope.mapViz = new window.TubeMapViz({
        stationRadius: 15,
        stationThickness: 10,
        lineWidth: 8,
        lineSpacing: 8,
        fontSize: 14
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
      }
      else {
        element[0].style.zIndex = null;
      }
      if(this.$scope.baseObjectHandle && this._inEditState===false){
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
