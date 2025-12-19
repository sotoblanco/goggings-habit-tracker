import sys
import os

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
from app.models import User, Task, RecurringTask, Goal, WeeklyGoal, SideQuest, Reward, PurchasedReward, DiaryEntry, Character, Wish, CoreTask
from sqlalchemy import inspect

def generate_mermaid_erd():
    print("erDiagram")
    
    # Tables and Columns
    for table_name, table in Base.metadata.tables.items():
        print(f"    {table_name} {{")
        for column in table.columns:
            col_type = str(column.type).split('(')[0]
            pk = "PK" if column.primary_key else ""
            fk = "FK" if column.foreign_keys else ""
            print(f"        {col_type} {column.name} {pk}{fk}")
        print("    }")

    # Relationships (Foreign Keys)
    for table_name, table in Base.metadata.tables.items():
        for column in table.columns:
            for fk in column.foreign_keys:
                target_table = fk.column.table.name
                # Simple relationship representation
                print(f"    {table_name} ||--o{{ {target_table} : \"{column.name}\"")

if __name__ == "__main__":
    generate_mermaid_erd()
