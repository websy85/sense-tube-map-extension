this.$scope.copyObject = function(callbackFn){
  //create a new alternate state
  that.$scope.currApp.model.enigmaModel.addAlternateState("TubeState").then(function(response){
    that.$scope.$parent.backendApi.model.getProperties().then(function(props){
      var baseHyperCubeDef = {
        qHyperCubeDef: cloneObject(props.qHyperCubeDef)
      };
      baseHyperCubeDef.qHyperCubeDef.qStateName = "TubeState";
      props.baseHyperCube = baseHyperCubeDef;
      that.$scope.$parent.backendApi.model.setProperties(props).then(function(response){
        that.$scope.$parent.backendApi.model.getLayout().then(function(layout){
					that.$scope.ready = true
          that.$scope.dimensionCount = props.qHyperCubeDef.qDimensions.length;
          that.$scope.measureCount = props.qHyperCubeDef.qMeasures.length;
          that.$scope.getAllData("/baseHyperCube/qHyperCubeDef", layout.baseHyperCube.qHyperCube, 0, callbackFn);
        });
      });
    });    
  });

  function cloneObject(inObj){
    var outObj = {};
    for (var key in inObj){
      outObj[key] = inObj[key]
    }
    return outObj;
  }
}
