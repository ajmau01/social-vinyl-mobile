import subprocess
import os

plan_file = 'conductor/tracks/phase_1_uplink_20260126/plan.md'

with open(plan_file, 'r') as f:
    lines = f.readlines()

current_milestone = None
current_task_title = None
current_task_body = []

def create_issue(title, body, milestone):
    if not title: return
    # Milestone command missing, so we prepend phase to title
    full_title = f'[{milestone}] {title}'
    print(f'Creating Issue: {full_title}')
    body_str = '\n'.join(body)
    # Removed --milestone flag
    subprocess.run(['gh', 'issue', 'create', '--title', full_title, '--body', body_str], check=True)

for line in lines:
    line = line.strip()
    if line.startswith('## Phase'):
        if current_task_title:
            create_issue(current_task_title, current_task_body, current_milestone)
            current_task_title = None
            current_task_body = []
        milestone_title = line.replace('## ', '').strip()
        # Skipping milestone creation as command is missing
        current_milestone = milestone_title
    elif line.startswith('- [ ] Task:'):
        if current_task_title:
            create_issue(current_task_title, current_task_body, current_milestone)
        current_task_title = line.replace('- [ ] Task:', '').strip()
        current_task_body = []
    elif '- [ ] Sub-task:' in line:
        clean_sub = line.split('- [ ] Sub-task:')[1].strip()
        current_task_body.append(f'- [ ] {clean_sub}')

if current_task_title:
    create_issue(current_task_title, current_task_body, current_milestone)
