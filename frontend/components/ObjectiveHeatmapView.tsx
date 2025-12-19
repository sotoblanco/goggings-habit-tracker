
import React, { useState, useMemo } from 'react';
import { Goal, Task } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { getCategoryColor } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ObjectiveHeatmapViewProps {
    goals: Goal[];
    getTasksForDate: (date: string) => Task[];
}

const TAILWIND_COLOR_MAP: { [key: string]: string } = {
    'red-500': '#ef4444',
    'blue-500': '#3b82f6',
    'yellow-500': '#eab308',
    'green-500': '#22c55e',
    'purple-500': '#a855f7',
    'indigo-500': '#6366f1',
    'pink-500': '#ec4899',
    'teal-500': '#14b8a6',
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeSector = (
    x: number,
    y: number,
    outerRadius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
) => {
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', startOuter.x, startOuter.y,
        'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        'L', endInner.x, endInner.y,
        'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        'L', startOuter.x, startOuter.y,
        'Z',
    ].join(' ');
};

export const ObjectiveHeatmapView: React.FC<ObjectiveHeatmapViewProps> = ({ goals, getTasksForDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const activeGoals = useMemo(() => goals.filter(g => !g.completed), [goals]);

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const data: { [day: number]: { [goalId: string]: boolean } } = {};

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = getLocalDateString(date);
            const tasksForDay = getTasksForDate(dateStr);
            data[i] = {};
            activeGoals.forEach(goal => {
                const workedOnGoal = tasksForDay.some(
                    task => task.completed && task.alignedGoalId === goal.id
                );
                data[i][goal.id] = workedOnGoal;
            });
        }
        return {
            daysInMonth,
            data,
        };
    }, [currentDate, activeGoals, getTasksForDate]);

    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    if (activeGoals.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400">
                <p>No active objectives found.</p>
                <p className="italic text-gray-500">Set a long-term objective to see your consistency heatmap.</p>
            </div>
        );
    }
    
    const SVG_SIZE = 550;
    const CENTER = SVG_SIZE / 2;
    const INNER_RADIUS = 80;
    const RING_WIDTH = 20;
    const GAP = 2;
    const LABEL_RADIUS = INNER_RADIUS + activeGoals.length * (RING_WIDTH + GAP) + 15;

    const anglePerDay = 360 / monthData.daysInMonth;

    return (
        <div className="pt-4 flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 mb-6">
                <button onClick={goToPreviousMonth} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Previous month">
                    <ChevronLeftIcon />
                </button>
                <h3 className="text-xl font-bold uppercase tracking-wider text-center w-48">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={goToNextMonth} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Next month">
                    <ChevronRightIcon />
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
                <div className="relative">
                    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                        <g transform={`translate(${CENTER}, ${CENTER})`}>
                            {/* Rings for each goal */}
                            {Array.from({ length: monthData.daysInMonth }).map((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const startAngle = dayIndex * anglePerDay;
                                const endAngle = (dayIndex + 1) * anglePerDay;
                                
                                return activeGoals.map((goal, goalIndex) => {
                                    const isCompleted = monthData.data[day]?.[goal.id] || false;
                                    const colorClass = getCategoryColor(goal.label || goal.description).dot;
                                    const colorKey = colorClass.replace('bg-', '');
                                    const colorValue = TAILWIND_COLOR_MAP[colorKey] || '#374151'; // fallback gray-700
                                    
                                    const innerRadius = INNER_RADIUS + goalIndex * (RING_WIDTH + GAP);
                                    const outerRadius = innerRadius + RING_WIDTH;
                                    const pathData = describeSector(0, 0, outerRadius, innerRadius, startAngle, endAngle - 0.5); // -0.5 for small gap
                                    const title = `${goal.label || goal.description} on day ${day}: ${isCompleted ? 'Progress Made' : 'No Progress'}`;

                                    return (
                                        <path
                                            key={`${goal.id}-${day}`}
                                            d={pathData}
                                            fill={isCompleted ? colorValue : 'rgba(55, 65, 81, 0.3)'}
                                            stroke="#111827"
                                            strokeWidth="1"
                                            className="transition-opacity hover:opacity-80"
                                        >
                                          <title>{title}</title>
                                        </path>
                                    );
                                });
                            })}
                             {/* Day labels */}
                            {Array.from({ length: monthData.daysInMonth }).map((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const angle = (dayIndex + 0.5) * anglePerDay;
                                const pos = polarToCartesian(0, 0, LABEL_RADIUS, angle);
                                return (
                                    <text
                                        key={`label-${day}`}
                                        x={pos.x}
                                        y={pos.y}
                                        dy=".3em"
                                        textAnchor="middle"
                                        fill="#9CA3AF"
                                        fontSize="10"
                                        className="font-bold"
                                    >
                                        {day}
                                    </text>
                                );
                            })}
                            <text
                                textAnchor="middle"
                                y="-10"
                                className="fill-gray-400 text-sm uppercase tracking-wider font-semibold"
                            >
                                {currentDate.toLocaleString('default', { month: 'long' })}
                            </text>
                             <text
                                textAnchor="middle"
                                y="15"
                                className="fill-white text-3xl font-black"
                            >
                                {currentDate.getFullYear()}
                            </text>
                        </g>
                    </svg>
                </div>
                
                <div className="w-full md:w-64">
                    <h4 className="text-lg font-bold uppercase tracking-wider mb-3 text-center md:text-left">Objectives</h4>
                    <ul className="space-y-2">
                        {activeGoals.map((goal, index) => {
                            const colorClass = getCategoryColor(goal.label || goal.description).dot;
                            return (
                                <li key={goal.id} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-md">
                                    <span className={`w-4 h-4 rounded-sm flex-shrink-0 ${colorClass}`}></span>
                                    <span className="text-sm text-gray-300">{index + 1}. {goal.label || goal.description}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};
