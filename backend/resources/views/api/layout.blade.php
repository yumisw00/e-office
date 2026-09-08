<div id="container" class="container ">

    <div id="datatable">
        <table class="tableku">

            <tr>
                <td style="width: 100%; display: flex; flex-direction: column; align-items: center;">
                    <?php echo $content ?>
                </td>
            </tr>
        </table>
    </div>
</div>
<style>
    .notshow {
        margin-top: 10px;
    }

    @media print {

        .notshow {
            display: none;
        }

        body {
            margin: 0px;
            padding: 10px 5px;
        }

        html {
            margin: 0px;
            padding: 0px;
        }
    }

    #container {
        max-width: 100%;
        width: 100%;
        font-size: 14px;
        padding-bottom: 20px;
        font-family: Arial, Helvetica, sans-serif;
    }

    td,
    th {
        padding: 3px;
        font-size: 12px;
        vertical-align: text-center;
    }

    /* .h4,
	.h5,
	.h6,
	h4,
	h5,
	h6,
	hr {
		margin-top: 5px;
		margin-bottom: 5px;
	} */

    .tableku {
        margin-top: 20px;
        width: 100%;
        /* border: 1px solid #555; */
    }

    .tableku>tr>td {
        /* border: 1px solid #555; */
        padding: 0px 0px;
        vertical-align: top;
    }

    .tableku thead th {
        /* border: 1px solid #555; */
        border-bottom: 2px solid #555;
        padding: 0px 3px;
    }

    .tableku th {
        /* border: 1px solid #555; */
        padding: 0px 3px;
    }

    .tableku thead,
    .tableku1 thead {
        /* border: 1px solid #555; */
        page-break-before: auto;
    }

    hr {
        border-color: #555;
    }

    .tableku1 {
        margin-top: 0px;
        width: 100%;
        /* border: 1px solid #555; */
    }

    .tableku1 td {
        /* border: 1px solid #555; */
        padding: 3px 5px;
        vertical-align: top;
    }

    .tableku1 thead th {
        /* border: 1px solid #555; */
        border-bottom: 2px solid #555;
        padding: 3px 5px;
        text-align: center;
    }

    .tableku1 th {
        /* border: 1px solid #555; */
        padding: 0px 3px;
        text-align: center;
    }

    h4 small {
        color: #ccc;
    }
</style>