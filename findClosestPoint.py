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

            cDistance = dist(targetPoint, pL) if pL else float('inf')
            
            if cDistance < closestDistance:
                closestPoint = pL
                closestDistance = cDistance
                low -= 1

            if abs(targetPoint[0] - pL[0]) if pL else float('inf') > closestDistance: # maybe issue
                leftDone = True

        if not rightDone:
            pH = data[high] if high < len(data) else None

            cDistance = dist(targetPoint, pH) if pH else float('inf')

            if cDistance < closestDistance:
                closestPoint = pH
                closestDistance = cDistance
                high += 1

            if abs(targetPoint[0] - pH[0]) if pH else float('inf') > closestDistance: # maybe issue
                rightDone = True

        if leftDone and rightDone:
            break

    return closestPoint


hahadata = [(random.random() * 1000, random.random() * 1000) for _ in range(100000)]
hahadata.sort(key=lambda point: point[0])  # Sort by x-coordinate

t = (333, 670)

guh = min(hahadata, key=lambda point: dist(point, t))
print(guh)

closest = find_closest_point(t, hahadata)
print(closest)