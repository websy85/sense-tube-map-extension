$scope.getAllData = function(layout, handle, lastRow, callbackFn){
  if(!layout.qHyperCube){
    callbackFn.call();
  }
  if(lastRow==0){
    layout.qHyperCube.qDataPages = [];
  }
  var pages = [{
    qTop: lastRow,
    qLeft: 0,
    qHeight: 100,
    qWidth: 10
  }];
  $scope.session.rpc({handle: handle, method: "GetHyperCubeData", params: ["/qHyperCubeDef", pages]}).then(function(response){
    var data = response.result.qDataPages[0];
    lastRow+=data.qArea.qHeight;
    layout.qHyperCube.qDataPages.push(data);
    if(lastRow < layout.qHyperCube.qSize.qcy){
      $scope.getAllData(layout, handle, lastRow, callbackFn);
    }
    else{
      callbackFn.call(null, layout);
    }
  }).catch(function(err){
    console.log(err);
  });
};
