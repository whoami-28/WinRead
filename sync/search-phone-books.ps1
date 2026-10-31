$shell = New-Object -ComObject Shell.Application
$pc = $shell.Namespace(17)
$phone = $pc.Items() | Where-Object { $_.Name -eq 'whoami' }
$storage = $phone.GetFolder.Items() | Select-Object -First 1
$storageFolder = $storage.GetFolder

function SearchFolder($folder, $depth) {
    if ($depth -gt 3) { return }
    foreach ($item in $folder.Items()) {
        if ($item.IsFolder) {
            if ($item.Name -match 'Download|Books|Documents|ReadEra|Telegram') {
                SearchFolder $item.GetFolder ($depth + 1)
            }
        } else {
            if ($item.Name -match '\.(fb2|epub|mobi|txt|zip)$') {
                Write-Output ($item.Name + " [size: " + $item.Size + "]")
            }
        }
    }
}

SearchFolder $storageFolder 1
