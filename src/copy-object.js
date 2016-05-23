$scope.copyObject = function(callbackFn){
  $scope.session = $scope.$parent.backendApi.model.session;
  var docHandle = $scope.session.currentApp.handle;
  var dummyDef = {
    qInfo:{
      qType: "Chart"
    }
  }
  //create a new alternate state
  $scope.session.rpc({handle: docHandle, method: "AddAlternateState", params:["TubeState"]}).then(function(response){
    //create the base object that will contain all of the map data
    $scope.session.rpc({handle: docHandle, method: "CreateSessionObject", params:[dummyDef]}).then(function(response){
      $scope.baseObjectHandle = response.result.qReturn.qHandle;
      var newId = response.result.qReturn.qGenericId;
      $scope.session.rpc({handle: $scope.origHandle, method: "GetProperties", params:[]}).then(function(response){
        var props = response.result.qProp;
        props.qInfo.qId = newId;
        $scope.session.rpc({handle: $scope.baseObjectHandle, method: "SetProperties", params:[props]}).then(function(response){
          //put the base object against the alternate state
          $scope.session.rpc({handle: $scope.baseObjectHandle, method: "ApplyPatches", params:[[{qPath:"/qHyperCubeDef/qStateName", qOp: "add", qValue: "\"TubeState\""}]]}).then(function(response){
            $scope.session.rpc({handle: $scope.baseObjectHandle, method: "GetLayout", params:[]}).then(function(response){
              $scope.baseObjectLayout = response.result.qLayout;
              $scope.dimensionCount = $scope.baseObjectLayout.qHyperCube.qDimensionInfo.length;
              $scope.measureCount = $scope.baseObjectLayout.qHyperCube.qMeasureInfo.length;
              $scope.getAllData($scope.baseObjectLayout, $scope.baseObjectHandle, 0, callbackFn);
            });
          });
        });
      });
    });
  });
}
