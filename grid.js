
function triangleGrid(startingPoint,endingPoint,center,length){
    var grid = []
    const v1x = startingPoint[0] - endingPoint[0]
    const v1y = startingPoint[1] - endingPoint[1]


    const angle = Math.PI/3
    const v2x = v1x * Math.cos(angle) - v1y * Math.sin(angle)
    const v2y = v1x * Math.sin(angle) + v1y * Math.cos(angle)


    const xLeftLimit = center[0] - length/2
    const xRightLimit = center[0] + length/2
    const yTopLimit = center[1] - length/2
    const yBottomLimit = center[1] + length/2


    const hyp = Math.sqrt(v1x**2,v1y**2)
    const limits = Math.floor(length/hyp) + 3


    for (let i = -limits; i < limits+1; i ++) {
       
        for (let j = -limits; j < limits+1; j ++){
            let x = startingPoint[0] + j * v1x
            let y = startingPoint[1] + j * v1y
            x += i * v2x
            y += i * v2y
            if (x > xLeftLimit && x < xRightLimit && y > yTopLimit && y < yBottomLimit){
                grid.push([x,y])
            }
        }
   
    }
    return grid
}
