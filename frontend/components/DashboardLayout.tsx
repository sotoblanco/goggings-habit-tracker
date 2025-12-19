import React from 'react';

interface DashboardLayoutProps {
    header: React.ReactNode;
    statusBar: React.ReactNode;
    leftColumn: React.ReactNode;
    centerColumn: React.ReactNode;
    rightColumn: React.ReactNode;
    modals: React.ReactNode;
    chatbot: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    header,
    statusBar,
    leftColumn,
    centerColumn,
    rightColumn,
    modals,
    chatbot
}) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {header}
            <main className="p-4 sm:p-8 space-y-6">
                {statusBar}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        {leftColumn}
                    </div>

                    {/* CENTER COLUMN */}
                    <div className="xl:col-span-2 space-y-6">
                        {centerColumn}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {rightColumn}
                    </div>
                </div>
            </main>
            {modals}
            {chatbot}
        </div>
    );
};
