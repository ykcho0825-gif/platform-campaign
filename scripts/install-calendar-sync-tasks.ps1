$ErrorActionPreference = 'Stop'

$syncScript = Join-Path $PSScriptRoot 'sync-calendar-and-deploy.ps1'
$businessHoursTask = 'CampaignDashboardV24CalendarSync-BusinessHours'
$closingTask = 'CampaignDashboardV24CalendarSync-Closing'

$quote = [char]34
$arguments = '-NoProfile -ExecutionPolicy Bypass -File ' + $quote + $syncScript + $quote
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited

$businessHoursTrigger = New-ScheduledTaskTrigger -Daily -At '09:00'
$closingTrigger = New-ScheduledTaskTrigger -Daily -At '18:00'

Register-ScheduledTask -TaskName $businessHoursTask -Action $action -Trigger $businessHoursTrigger -Settings $settings -Principal $principal -Force | Out-Null
Register-ScheduledTask -TaskName $closingTask -Action $action -Trigger $closingTrigger -Settings $settings -Principal $principal -Force | Out-Null

$scheduler = New-Object -ComObject 'Schedule.Service'
$scheduler.Connect()
$taskFolder = $scheduler.GetFolder('\')
$businessDefinition = $taskFolder.GetTask($businessHoursTask).Definition
$businessDefinition.Triggers.Item(1).Repetition.Interval = 'PT30M'
$businessDefinition.Triggers.Item(1).Repetition.Duration = 'PT9H'
$taskFolder.RegisterTaskDefinition($businessHoursTask, $businessDefinition, 6, $principal.UserId, $null, 3) | Out-Null

Write-Output 'Registered business-hours sync (09:00-17:30 every 30 minutes).'
Write-Output 'Registered closing sync (daily at 18:00).'
