import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../../components/Modal/Modal.jsx';
import Button from '../../../components/Buttons/Button.jsx';
import { useVM } from '../../../shared/mvvm/viewModelHooks.js';

// Обрізання аватара до квадрата (порт vanilla profile-avatar.js): Cropper.js на <img>,
// результат — JPEG 512×512.
function AvatarCropModal() {
    const vm = useVM();
    const imageRef = useRef(null);
    const cropperRef = useRef(null);
    const source = vm.cropSource;

    useEffect(
        () => () => {
            cropperRef.current?.destroy();
            cropperRef.current = null;
        },
        [source],
    );

    const initCropper = () => {
        cropperRef.current?.destroy();
        cropperRef.current = new Cropper(imageRef.current, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            dragMode: 'move',
            background: false,
        });
    };

    const save = () => {
        const canvas = cropperRef.current?.getCroppedCanvas({ width: 512, height: 512, imageSmoothingQuality: 'high' });
        canvas?.toBlob((blob) => vm.saveAvatar(blob), 'image/jpeg', 0.9);
    };

    return (
        <Modal open={Boolean(source)} onClose={vm.cancelCrop} size="sm">
            <ModalHeader title="Обрізати аватар" />
            <ModalBody>
                {source && (
                    <div className="max-h-[60vh] overflow-hidden rounded-lg">
                        <img ref={imageRef} src={source} alt="" onLoad={initCropper} className="block max-w-full" />
                    </div>
                )}
                {vm.avatarError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{vm.avatarError}</p>}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" size="sm" onClick={vm.cancelCrop}>
                    Скасувати
                </Button>
                <Button size="sm" onClick={save} disabled={vm.savingAvatar}>
                    {vm.savingAvatar ? 'Збереження…' : 'Зберегти'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default observer(AvatarCropModal);
