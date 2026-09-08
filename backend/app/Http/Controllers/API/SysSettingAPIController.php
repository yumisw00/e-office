<?php

namespace App\Http\Controllers\API;


use App\Http\Controllers\BaseResourceController;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/**
 * Class SysSettingAPIController
 */
class SysSettingAPIController extends BaseResourceController
{
    public function __construct()
    {
        $this->model = new \App\Models\SysSetting;
        $this->middleware('EnsureHasGroup:sys_setting', ['only' => ['create', 'store', 'edit', 'delete']]);
        $this->background_login = 'background_login';
        $this->background_login_name = 'bg-login';
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate($this->model->rules);

        $data = $request->all();

        /*
        $file = $data['file'];

        if ($file) {
            if ($file['size'] >= 5000000)
                return $this->fail("File Harus Kurang Dari 5Mb");

            $src = $file['src'];

            unset($data['file']);
            // $file_name = time();
            $file_name = $this->background_login;
            $full_path = "./uploads/" . $file_name;
            $data['file_name'] = $file_name;
            $data['client_name'] = $this->background_login_name;
            $data['file_type'] = $file['type'];
            $data['file_size'] = $file['size'];
            list($t, $code) = explode(",", $src);
            Storage::put($file_name, base64_decode($code));
            // file_put_contents($full_path, base64_decode($code));
            // var_dump($data);
            $type = explode('/', $data['file_type'])[1];
            $data['isi'] =  $data['file_name'] . "/" . $data['client_name'] . "." .  $type;
        }
        */

        $id = $this->model->insert($data);
        $data[$this->model->primaryKey] = $id;

        return $this->respondCreated($data, 'data created');
    }

    public function update($id = null, Request $request): JsonResponse
    {
        $request->validate($this->model->rules);

        if (!$data_before = $this->model->find($id)) {
            return $this->failNotFound(sprintf(
                'item with id %d not found',
                $id
            ));
        }

        $updateData = $request->all();

        if (!empty($updateData['file'])) {
            $file = $updateData['file'];
            $src = $file['src'];

            if ($file['size'] >= 5000000)
                return $this->fail("File Harus Kurang Dari 5Mb");
            unset($updateData['file']);
            // $file_name = time();
            $file_name = $this->background_login;
            $full_path = "./uploads/" . $file_name;
            // $updateData['file_name'] = $file_name;
            // $updateData['client_name'] = $file['name'];
            // $updateData['file_type'] = $file['type'];
            // $updateData['file_size'] = $file['size'];
            list($t, $code) = explode(",", $src);
            Storage::put($file_name, base64_decode($code));
            // file_put_contents($full_path, base64_decode($code));
            if ($data_before->file_name)
                Storage::delete($data_before->file_name);
            // $full_path_lama = "./uploads/" . $data_before->get()->toArray()[0]->file_name;
            // unlink($full_path_lama);

            $type = explode('/', $file['type'])[1];
            $updateData['isi'] =  $file_name . "/" . $this->background_login_name . "." . $type;
        }

        $this->model->update($id, $updateData, $data_before);

        return $this->respond($updateData, 200, 'data updated');
    }
}
