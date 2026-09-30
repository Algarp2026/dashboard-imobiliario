# The View Olhão

`data.xlsx` é a fonte de manutenção do Comparador; `data.json` é derivado da folha `Dados` e usado pelo site. Depois de editar o Excel, execute `python scripts/data_workbook.py` e confirme com `python scripts/data_workbook.py --check` antes do deploy. O script usa apenas a biblioteca padrão do Python 3.

Nesta atualização, o Excel anexado foi reconciliado uma única vez com os PVP e campos de análise técnica já existentes nas 39 frações The View. Para futuras atualizações, edite diretamente `data.xlsx`; não volte a executar `--reconcile` nem substitua as colunas técnicas sem confirmar os preços base.
