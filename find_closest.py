import random

def dist(point1, point2):
    return ((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2) ** 0.5


def find_closest_point(targetPoint, data):
    left, right = 0, len(data) - 1

    while left <= right:
        mid = (left + right) // 2
        midPoint = data[mid]

        if midPoint[0] < targetPoint[0]:
            left = mid + 1
        else:
            right = mid - 1

    # have mid

    closestPoint = data[mid]
    closestDistance = dist(targetPoint, data[mid])
    low, high = mid-1, mid+1
    leftDone,  rightDone = False, False

    while True:
        
        if not leftDone:
            
            pL = data[low] if low >= 0 else None
            
            if not pL:
                leftDone = True
            else:
                cDistance = dist(targetPoint, pL)
                if cDistance < closestDistance:
                    closestPoint = pL
                    closestDistance = cDistance
                    
                if abs(targetPoint[0] - pL[0]) > closestDistance:
                    leftDone = True
                low -= 1

        if not rightDone:
            pH = data[high] if high < len(data) else None
            if not pH:
                rightDone = True
            else:
                cDistance = dist(targetPoint, pH)
                if cDistance < closestDistance:
                    closestPoint = pH
                    closestDistance = cDistance

                if abs(targetPoint[0]-pH[0]) > closestDistance:
                    rightDone = True
                high += 1


        if leftDone and rightDone:
            break

    return closestPoint


hahadata = [(random.random() * 1000, random.random() * 1000) for _ in range(100000)]
hahadata2 = [(random.random() * 1000, random.random() * 1000) for _ in range(1000)]
hahadata.sort(key=lambda point: point[0])  # Sort by x-coordinate


# for p in hahadata2:
#     guh = min(hahadata, key=lambda point: dist(point, p))
    
# print("slower hopefully")


for p in hahadata2:
    closest = find_closest_point(p, hahadata)
    print(closest)
print("faster hopefully")