import math
from random import random
import random


def getCities(leftTop,rightBottom,horizontal,vertical):
    lists = []
    center = [(leftTop[0] + rightBottom[0]) / 2, (leftTop[1] + rightBottom[1]) / 2]
    for i in range(horizontal):
        for j in range(vertical):
            xCoor = leftTop[0] + (i + 0.5) * (rightBottom[0] - leftTop[0]) / horizontal
            yCoor = leftTop[1] + (j + 0.5) * (rightBottom[1] - leftTop[1]) / vertical
            lists.append([xCoor, yCoor, math.dist(center, [xCoor, yCoor])])
    return mergeSort(lists)
    
def mergeSort(lists):
    if len(lists) <= 1:
        return lists
    mid = len(lists) // 2
    left = mergeSort(lists[:mid])
    right = mergeSort(lists[mid:])
    return merge(left, right)


def merge(left,right):
    result = []
    i,j = 0,0

    while i < len(left) and j < len(right):
        if left[i][2] < right[j][2]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result += left[i:]
    result += right[j:]

    return result

import matplotlib.pyplot as plt
import time

def visualize_sort_steps(arr):
    fig, ax = plt.subplots()

    for i in range(len(arr)):
        ax.clear()

        # take points one at a time
        points = arr[:i+1]

        x = []
        y = []

        for point in points:
            x.append(point[0])
            y.append(point[1])

        ax.scatter(x, y)

        for point in points:
            ax.text(point[0], point[1], 
                    f"{point[2]:.2f}")

        ax.set_title(f"Step {i+1}/{len(arr)}")
        ax.set_xlim(-1, 11)
        ax.set_ylim(-1, 11)

        plt.pause(0.5)

    plt.show()

visualize_sort_steps(getCities([0, 0], [10, 10], 5, 5))