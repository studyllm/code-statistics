// 测试文件 - JavaScript
function calculateSum(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0);
}

function calculateAverage(numbers) {
    if (numbers.length === 0) {
        return 0;
    }
    return calculateSum(numbers) / numbers.length;
}

function findMax(numbers) {
    return Math.max(...numbers);
}

function findMin(numbers) {
    return Math.min(...numbers);
}

module.exports = {
    calculateSum,
    calculateAverage,
    findMax,
    findMin
}; 